import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateConversationSummary = async (messages: string[]) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const conversationText = messages.map((m, i) => `Message ${i + 1}: ${m}`).join("\n");

    const prompt = `
You are an AI assistant that summarizes team discussions.

Your job is to extract the key points from a technical conversation.

Focus on:
- important decisions
- key ideas
- constraints
- conclusions

Do NOT include greetings or small talk.

Conversation:
${conversationText}

Provide a concise summary (3-5 bullet points).
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    return summary;
};
