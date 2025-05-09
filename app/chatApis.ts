"use server";
import "dotenv/config";
import { Groq } from "groq-sdk";
const groqApiKey = process.env.groqApiKey;
const groq = new Groq({ apiKey: groqApiKey });
const convo: string[] = [];

export async function queryGroq(query: string, model: string): Promise<string> {
	convo.push(query);
    console.log(query);
    console.log(model);
	const chatCompletion: Promise<string> = await groq.chat.completions.create({
		messages: convo,
		model: model,
		temperature: 0.6,
		max_completion_tokens: 4096,
		top_p: 0.95,
		stream: false,
		stop: null,
	});

	return chatCompletion;
}
