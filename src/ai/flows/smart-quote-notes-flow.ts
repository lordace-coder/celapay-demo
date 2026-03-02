'use server';
/**
 * @fileOverview A Genkit flow to suggest professional and contextually relevant notes for seller quotes.
 *
 * - smartQuoteNotes - A function that generates suggested quote notes.
 * - SmartQuoteNotesInput - The input type for the smartQuoteNotes function.
 * - SmartQuoteNotesOutput - The return type for the smartQuoteNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartQuoteNotesInputSchema = z.object({
  productName: z.string().describe("The name of the product the buyer is requesting a quote for."),
  productDescription: z.string().optional().describe("A description of the product, if available."),
  productPrice: z.number().describe("The price of the product."),
  buyerMessage: z.string().describe("The buyer's message or request for the quote."),
});
export type SmartQuoteNotesInput = z.infer<typeof SmartQuoteNotesInputSchema>;

const SmartQuoteNotesOutputSchema = z.object({
  suggestedNote: z.string().describe("A professional and contextually relevant note for the seller to include in the quote."),
});
export type SmartQuoteNotesOutput = z.infer<typeof SmartQuoteNotesOutputSchema>;

export async function smartQuoteNotes(input: SmartQuoteNotesInput): Promise<SmartQuoteNotesOutput> {
  return smartQuoteNotesFlow(input);
}

const smartQuoteNotesPrompt = ai.definePrompt({
  name: 'smartQuoteNotesPrompt',
  input: { schema: SmartQuoteNotesInputSchema },
  output: { schema: SmartQuoteNotesOutputSchema },
  prompt: `You are a professional assistant for a business seller. Your task is to generate a concise, professional, and helpful note for a quote that a seller will send to a buyer.

The note should acknowledge the buyer's request and highlight key aspects of the product or service, or add relevant information.

Consider the following details:

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Product Price: $ {{{productPrice}}}
Buyer's Message: {{{buyerMessage}}}

Based on this information, suggest a professional note to include in the quote. The note should be encouraging and informative.
`,
});

const smartQuoteNotesFlow = ai.defineFlow(
  {
    name: 'smartQuoteNotesFlow',
    inputSchema: SmartQuoteNotesInputSchema,
    outputSchema: SmartQuoteNotesOutputSchema,
  },
  async (input) => {
    const { output } = await smartQuoteNotesPrompt(input);
    return output!;
  }
);
