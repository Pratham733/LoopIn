
'use server';
/**
 * @fileOverview A news fetching AI agent.
 *
 * - getNewsForTopic - A function that fetches news articles for a given topic.
 * - GetNewsInput - The input type for the getNewsForTopic function.
 * - GetNewsOutput - The return type for the getNewsForTopic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GetNewsInputSchema = z.object({
  topic: z.string().describe('The topic for which to fetch news articles, e.g., "Technology", "Sports".'),
});
export type GetNewsInput = z.infer<typeof GetNewsInputSchema>;

const NewsArticleSchema = z.object({
    title: z.string().describe('The headline of the news article.'),
    description: z.string().describe('A brief summary of the news article, about 1-2 sentences long.'),
    source: z.string().describe('The name of the news source, e.g., "Tech Chronicles", "Sports Daily".'),
    url: z.string().describe('A valid URL to the full article.'),
    imageUrl: z.string().describe('A valid URL to an image representing the article. Use placeholder images from https://placehold.co/.'),
});

const GetNewsOutputSchema = z.object({
  articles: z
    .array(NewsArticleSchema)
    .describe('An array of 5 news articles related to the topic.'),
});
export type GetNewsOutput = z.infer<typeof GetNewsOutputSchema>;

export async function getNewsForTopic(input: GetNewsInput): Promise<GetNewsOutput> {
  return getNewsForTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'newsPrompt',
  input: {schema: GetNewsInputSchema},
  output: {schema: GetNewsOutputSchema},
  prompt: `You are a world-class news aggregation AI with access to the latest information up to the current date. Your task is to generate a list of 5 recent, highly plausible, and impactful news articles for the given topic. The headlines should reflect events that could realistically be happening right now.

  For the topic "{{{topic}}}", please generate 5 articles.

  Each article must include:
  - A compelling and realistic title that sounds like it's from a major news outlet.
  - A concise, informative description (1-2 sentences).
  - A fictional but credible-sounding source name (e.g., "Global News Network", "TechBeat Today", "The Sports Sentinel").
  - A placeholder URL, which can be "https://news.example.com/article/[random-id]".
  - A placeholder image URL from "https://placehold.co/600x400.png". Do not add any text to the placeholder URL.

  Return the result in the specified JSON format. Ensure the tone is professional and the content is engaging.
  `,
});

const getNewsForTopicFlow = ai.defineFlow(
  {
    name: 'getNewsForTopicFlow',
    inputSchema: GetNewsInputSchema,
    outputSchema: GetNewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
