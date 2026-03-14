import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateConversationSummary = async (messages: string[]) => {
    try {
        console.log("--- Gemini Summary Start ---");
        console.log("Model: gemini-2.0-flash-lite");

        console.log("Using key:", process.env.GEMINI_API_KEY?.slice(0, 12));

        // Change this line — gemini-1.5-flash is retired
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const conversationText = messages.map((m, i) => `Message ${i + 1}: ${m}`).join("\n");

        const prompt = `You are an AI assistant that summarizes team discussions.

Summarize this conversation into 3-5 concise bullet points. Focus on:
- Key decisions made
- Important action items or tasks
- Main conclusions or outcomes

Do NOT include greetings or small talk.

Conversation:
${conversationText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("--- Gemini Summary Success ---");
        return text;
    } catch (error: any) {
        console.error("--- Gemini API Error Details ---");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
        throw error;
    }
};
