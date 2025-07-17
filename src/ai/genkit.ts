// Server-side only - prevent client-side imports
if (typeof window !== 'undefined') {
  throw new Error('Genkit AI should only be used on the server side');
}

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
