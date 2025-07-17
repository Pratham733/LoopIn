'use server';
/**
 * @fileOverview An AI-powered chat search agent.
 *
 * - searchChat - A function that finds relevant messages in a conversation based on a query.
 * - SearchChatInput - The input type for the searchChat function.
 * - SearchChatOutput - The return type for the searchChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Simplified message schema for the AI, ensuring content is always text.
const SearchableMessageSchema = z.object({
  id: z.string().describe("The unique ID of the message."),
  senderId: z.string().describe("The ID of the user who sent the message."),
  textContent: z.string().describe("The textual content of the message. Non-text content is represented as a placeholder like '[Image: filename.jpg]'."),
});

const SearchChatInputSchema = z.object({
  query: z.string().describe("The user's search query."),
  messages: z.array(SearchableMessageSchema).describe("The list of all messages in the conversation."),
});
export type SearchChatInput = z.infer<typeof SearchChatInputSchema>;


const SearchResultItemSchema = z.object({
  messageId: z.string().describe("The unique ID of the relevant message."),
  relevance: z.string().describe("A brief explanation of why this message is relevant to the search query."),
  contentSnippet: z.string().describe("A short snippet of the message content."),
});

const SearchChatOutputSchema = z.object({
  results: z.array(SearchResultItemSchema).describe("An array of messages that are most relevant to the search query, along with relevance details."),
});
export type SearchChatOutput = z.infer<typeof SearchChatOutputSchema>;


export async function searchChat(input: SearchChatInput): Promise<SearchChatOutput> {
  return searchChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchChatPrompt',
  input: { schema: SearchChatInputSchema },
  output: { schema: SearchChatOutputSchema },
  prompt: `You are a highly intelligent search assistant integrated into a chat application.
Your task is to analyze a conversation history and identify the messages that are most relevant to a user's search query.

Conversation History (provided as a list of messages):
{{#each messages}}
- Message ID: {{this.id}}, From: {{this.senderId}}, Content: "{{this.textContent}}"
{{/each}}

User's Search Query: "{{query}}"

Based on the query, identify the most relevant messages. For each relevant message, provide its ID, a short content snippet (around 10-15 words), and a brief explanation of its relevance.
Return the results in the specified JSON format. If no messages are relevant, return an empty array for "results". Do not include messages that are only tangentially related. Focus on direct matches or strong semantic relevance.
`,
});

const searchChatFlow = ai.defineFlow(
  {
    name: 'searchChatFlow',
    inputSchema: SearchChatInputSchema,
    outputSchema: SearchChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
