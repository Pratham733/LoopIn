
'use server';
/**
 * @fileOverview An AI agent for generating social media post captions.
 *
 * - generatePostCaption - A function that suggests a caption based on media.
 * - GenerateCaptionInput - The input type for the function.
 * - GenerateCaptionOutput - The return type for the function.
 */

// Server-side only check
if (typeof window !== 'undefined') {
  throw new Error('AI flows should only be used on the server side');
}

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const MediaItemSchema = z.object({
  dataUri: z
    .string()
    .describe(
      "A media file (image or video) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mimeType: z.string().describe("The MIME type of the media file, e.g., 'image/png'."),
});

const GenerateCaptionInputSchema = z.object({
  media: z.array(MediaItemSchema).describe("An array of media files to generate a caption for."),
  userContext: z.string().optional().describe("Optional user-provided context or keywords for the caption."),
});
export type GenerateCaptionInput = z.infer<typeof GenerateCaptionInputSchema>;

const GenerateCaptionOutputSchema = z.object({
  caption: z.string().describe('A creative and engaging caption for the post, including relevant hashtags.'),
});
export type GenerateCaptionOutput = z.infer<typeof GenerateCaptionOutputSchema>;

export async function generatePostCaption(input: GenerateCaptionInput): Promise<GenerateCaptionOutput> {
  return generateCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCaptionPrompt',
  input: {schema: GenerateCaptionInputSchema},
  output: {schema: GenerateCaptionOutputSchema},
  prompt: `You are an expert social media manager specializing in writing witty, engaging, and relevant captions for posts.

Based on the attached image(s) and any user-provided context, generate one creative caption. The caption should be interesting and may include relevant, popular hashtags.

{{#if userContext}}
User has provided this context: {{{userContext}}}
Use this to guide the caption.
{{/if}}

Attached Media:
{{#each media}}
- {{media url=this.dataUri}}
{{/each}}

Generate a single, compelling caption.
`,
});

const generateCaptionFlow = ai.defineFlow(
  {
    name: 'generateCaptionFlow',
    inputSchema: GenerateCaptionInputSchema,
    outputSchema: GenerateCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
