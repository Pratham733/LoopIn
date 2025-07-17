'use server';

/**
 * @fileOverview A smart reply suggestion AI agent.
 *
 * - generateSmartReplies - A function that generates smart reply suggestions for a given message.
 * - SmartReplyInput - The input type for the generateSmartReplies function.
 * - SmartReplyOutput - The return type for the generateSmartReplies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReplyInputSchema = z.object({
  message: z.string().describe('The incoming message to generate smart replies for.'),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

const SmartReplyOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of smart reply suggestions for the message.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function generateSmartReplies(input: SmartReplyInput): Promise<SmartReplyOutput> {
  return generateSmartRepliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: {schema: SmartReplyInputSchema},
  output: {schema: SmartReplyOutputSchema},
  prompt: `You are a helpful assistant that suggests smart replies for incoming messages in a chat application.

  Given the following message, generate three smart reply suggestions that the user can use to quickly respond.

  Message: {{{message}}}

  The suggestions should be short and relevant to the message.
  Format the response as a JSON array of strings.
  `,
});

const generateSmartRepliesFlow = ai.defineFlow(
  {
    name: 'generateSmartRepliesFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
