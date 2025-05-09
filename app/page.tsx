"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button"; // Import from shadcn/ui
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Send,
	MessageSquare,
	Loader2,
	XCircle,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { queryGroq } from "./chatApis";

const chatApi = async (message: string, model: string): Promise<string> => {
	const groqModels = [
		"gemma-2-instruct",
		"llama-3.3-70b-versatile",
		"deepSeek-r1-distill-llama-70b",
	];
    let res: Promise<string>;
	if (model in groqModels) {
		res = await queryGroq(message, model);
	}

	return res;
};

// Message interface
interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	error?: boolean;
}

// Animation variants
const messageVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
	exit: { opacity: 0, y: -10, transition: { duration: 0.1 } },
};

const ChatMessage = ({ message }: { message: Message }) => {
	const getMessageIcon = (role: "user" | "assistant") => {
		switch (role) {
			case "user":
				return <MessageSquare className="w-5 h-5 text-blue-400" />;
			case "assistant":
				return <MessageSquare className="w-5 h-5 text-green-400" />;
			default:
				return null;
		}
	};

	return (
		<motion.div
			variants={messageVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			className={cn(
				"flex items-start gap-4 p-4 rounded-lg",
				message.role === "user"
					? "bg-blue-500/10 justify-end"
					: "bg-green-500/10",
				message.error && "bg-red-500/10 border border-red-500/50",
			)}
		>
			{getMessageIcon(message.role)}
			<div className="flex-1 whitespace-pre-wrap break-words">
				{message.error ? (
					<div className="flex items-center gap-2">
						<AlertTriangle className="w-5 h-5 text-red-400" />
						<p className="text-red-400">Error: {message.content}</p>
					</div>
				) : (
					<p
						className={cn(
							"text-gray-100",
							message.role === "user" ? "text-right" : "text-left",
						)}
					>
						{message.content}
					</p>
				)}
			</div>
		</motion.div>
	);
};

const AIChatApp = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [selectedModel, setSelectedModel] = useState("gemma-2-instruct");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Scroll to bottom whenever messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = inputRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${textarea.scrollHeight}px`;
		}
	}, [input]);

	// Handle user input change
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	// Handle model selection change
	const handleModelChange = (value: string) => {
		setSelectedModel(value);
	};

	// Handle sending a message
	const sendMessage = useCallback(async () => {
		if (!input.trim() || loading) return;

		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: "user",
			content: input,
		};
		const newMessages = [...messages, userMessage];
		setMessages(newMessages);
		setInput("");
		setLoading(true);

		try {
			const response = await chatApi(input, selectedModel);
			const assistantMessage: Message = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: response,
			};
			setMessages([...newMessages, assistantMessage]);
		} catch (error: any) {
			const errorMessage: Message = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: `Failed to fetch response: ${error.message}`,
				error: true,
			};
			setMessages([...newMessages, errorMessage]);
		} finally {
			setLoading(false);
		}
	}, [input, messages, loading, selectedModel]);

	// Handle Enter key press (and Shift+Enter for new line)
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	// Clear all messages
	const clearConversation = () => {
		setMessages([]);
		setInput("");
	};

	return (
		<div className="flex flex-col h-screen bg-gray-900">
			{/* Chat Header */}
			<div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
				<h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
					<MessageSquare className="w-6 h-6 text-blue-400" />
					Chat Way
				</h1>
				<div className="flex items-center gap-4">
					<Select value={selectedModel} onValueChange={handleModelChange}>
						<SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-gray-200">
							<SelectValue placeholder="Select a model" />
						</SelectTrigger>
						<SelectContent className="bg-gray-800 border-gray-700">
							<SelectItem
								value="gemma-2-instruct"
								className="hover:bg-gray-700/50 text-gray-200"
							>
								Gemma 2 Instruct
							</SelectItem>
							<SelectItem
								value="llama-3.3-70b-versatile"
								className="hover:bg-gray-700/50 text-gray-200"
							>
								Llama 3.3 70b Versatile
							</SelectItem>
							<SelectItem
								value="deepSeek-r1-distill-llama-70b"
								className="hover:bg-gray-700/50 text-gray-200"
							>
								DeepSeek R1 Distill Llama 70b
							</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						onClick={clearConversation}
						className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/50"
					>
						<XCircle className="w-4 h-4 mr-2" />
						Clear
					</Button>
				</div>
			</div>

			{/* Message Display Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				<AnimatePresence>
					{messages.map((message) => (
						<ChatMessage key={message.id} message={message} />
					))}
				</AnimatePresence>
				<div ref={messagesEndRef} /> {/* Ref for scrolling to bottom */}
			</div>

			{/* Input Area */}
			<div className="bg-gray-800 p-4 border-t border-gray-700">
				<div className="flex gap-4">
					<Textarea
						ref={inputRef}
						value={input}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Type your message..."
						className="flex-1 bg-gray-700 text-gray-200 border-gray-600 rounded-md resize-none min-h-[2.5rem] focus:ring-2 focus:ring-blue-500"
						rows={1}
						disabled={loading}
					/>
					<Button
						variant="primary"
						onClick={sendMessage}
						className="bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className="w-5 h-5 mr-2 animate-spin" />
								Sending...
							</>
						) : (
							<>
								<Send className="w-5 h-5" />
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default AIChatApp;
