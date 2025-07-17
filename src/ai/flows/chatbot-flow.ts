
'use server';
/**
 * @fileOverview A conversational AI assistant flow that can also analyze images and documents.
 *
 * - chatWithAssistant - A function to interact with the AI assistant.
 * - ChatbotInput - The input type for the chatWithAssistant function.
 * - ChatbotOutput - The return type for the chatWithAssistant function.
 * - HistoryMessage - The type for individual messages in the conversation history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a type for individual history messages for clarity
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe("The role of the message sender, either 'user' or 'model' (AI)."),
  content: z.string().describe("The content of the message.")
});
export type HistoryMessage = z.infer<typeof HistoryMessageSchema>;

const ChatbotInputSchema = z.object({
  userInput: z.string().describe('The user message to the AI assistant. Can be empty if a file is provided.'),
  attachment: z.object({
    dataUri: z.string().describe("The file attachment as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    mimeType: z.string().describe("The MIME type of the attached file, e.g., 'image/png' or 'application/pdf'."),
    name: z.string().describe("The name of the attached file.")
  }).optional().describe("An optional file (image or document) for the AI to analyze."),
  history: z.array(HistoryMessageSchema).optional().describe('The conversation history, if any. Each message should indicate if it was from the "user" or the "model" (AI).'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  aiResponse: z.string().describe('The AI assistant\'s response.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chatWithAssistant(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}

// System prompt to define the AI's persona
const systemPrompt = `You are LoopIn Bot, a friendly, witty, and deeply knowledgeable AI assistant for the LoopIn application.
Your primary goal is to provide comprehensive, clear, and well-structured answers to user queries.

**Core Capabilities:**
- **Conversational Expert:** Engage in helpful and detailed conversations on a wide range of topics.
- **Image Analysis:** When a user provides an image, describe it in detail, identify key objects or themes, and answer any specific questions about it.
- **Document Analysis:** When a user provides a document (like a PDF or TXT file), provide a thorough summary, extract key information, identify main points, and answer questions based on the document's content.

**Response Style:**
- **Clarity and Structure:** Always provide full, clear, and structured answers. Use formatting like bullet points, numbered lists, and bold text to enhance readability and break down complex information.
- **Informative and Comprehensive:** Avoid overly concise answers. Aim to be thorough and provide complete information, explaining your reasoning where appropriate.
- **Friendly and Engaging:** Maintain a friendly and helpful tone. You can use emojis sparingly to add personality.
- **Chat Interface Context:** Remember you are interacting with a user in a chat interface.`;

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  system: systemPrompt,
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: (input: ChatbotInput) => {
    let historyStr = "";
    // Construct the history string ensuring roles are clearly indicated for the model
    if (input.history && input.history.length > 0) {
      historyStr = input.history.map(msg => `${msg.role === 'user' ? 'User' : 'LoopIn Bot'}: ${msg.content}`).join('\n');
    }

    const parts: Array<{text: string} | {media: {url: string}}> = [];

    // Add conversation history if present
    if (historyStr) {
      parts.push({
        text: `This is the conversation history so far:\n${historyStr}\n\n`
      });
    }

    // Add the user's current message
    parts.push({
      text: `The user's latest message is:\nUser: ${input.userInput}`
    });

    // Add attachment if present
    if (input.attachment) {
      parts.push({
        text: `The user has attached a file named "${input.attachment.name}". Analyze the file based on your capabilities for its MIME type (${input.attachment.mimeType}). File for analysis:`
      });
      parts.push({
        media: {
          url: input.attachment.dataUri
        }
      });
    }

    // Add the response prompt
    parts.push({
      text: '\nLoopIn Bot:'
    });

    return parts;
  }
});


const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
