'use server';
/**
 * @fileOverview A Genkit flow that generates a concise summary of a seller's transaction history.
 *
 * - summarizeTransactionPerformance - A function that handles the transaction performance summary process.
 * - TransactionPerformanceSummaryInput - The input type for the summarizeTransactionPerformance function.
 * - TransactionPerformanceSummaryOutput - The return type for the summarizeTransactionPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for a single transaction
const TransactionSchema = z.object({
  txn_id: z.string().describe('Unique transaction identifier.'),
  status: z.enum(['PENDING', 'AWAITING', 'AWAITING_CONFIRMATION', 'PAYMENT_SUBMITTED', 'COMPLETED', 'DECLINED']).describe('The current status of the transaction.'),
  buyer_name: z.string().describe('The name of the buyer.'),
  product_name: z.string().describe('The name of the product sold.'),
  amount: z.number().describe('The monetary amount of the transaction.'),
});

// Input schema for the entire flow
const TransactionPerformanceSummaryInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('An array of historical transaction records for the seller.'),
});
export type TransactionPerformanceSummaryInput = z.infer<typeof TransactionPerformanceSummaryInputSchema>;

// Output schema for the generated summary
const TransactionPerformanceSummaryOutputSchema = z.object({
  totalRevenue: z.number().describe('The total revenue generated from completed transactions.'),
  averageTransactionValue: z.number().describe('The average value of completed transactions.'),
  popularProducts: z.array(z.string()).describe('A list of the most popular products by number of sales.'),
  summaryText: z.string().describe('A concise natural language summary of the transaction performance.'),
});
export type TransactionPerformanceSummaryOutput = z.infer<typeof TransactionPerformanceSummaryOutputSchema>;

// Exported wrapper function
export async function summarizeTransactionPerformance(input: TransactionPerformanceSummaryInput): Promise<TransactionPerformanceSummaryOutput> {
  return transactionPerformanceSummaryFlow(input);
}

// Define the Genkit prompt
const transactionSummaryPrompt = ai.definePrompt({
  name: 'transactionSummaryPrompt',
  input: {schema: TransactionPerformanceSummaryInputSchema},
  output: {schema: TransactionPerformanceSummaryOutputSchema},
  prompt: `You are a business analyst. Your task is to analyze the provided transaction data and generate a concise summary of the seller's performance.

Focus on the following key metrics from COMPLETED transactions:
1.  **Total Revenue**: Sum of amounts from all completed transactions.
2.  **Average Transaction Value**: Average of amounts from all completed transactions.
3.  **Popular Products**: Identify the top 3 products sold based on the number of completed sales.

Provide a natural language summary in the 'summaryText' field, followed by the calculated metrics in their respective fields.
If there are no completed transactions, state that clearly in the summaryText and set numerical values to 0 and popularProducts to an empty array.

Here is the transaction data:
{{#if transactions}}
  {{#each transactions}}
    - Transaction ID: {{this.txn_id}}, Status: {{this.status}}, Product: {{this.product_name}}, Amount: {{this.amount}}
  {{/each}}
{{else}}
  No transactions provided.
{{/if}}
`,
});

// Define the Genkit flow
const transactionPerformanceSummaryFlow = ai.defineFlow(
  {
    name: 'transactionPerformanceSummaryFlow',
    inputSchema: TransactionPerformanceSummaryInputSchema,
    outputSchema: TransactionPerformanceSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await transactionSummaryPrompt(input);
    return output!;
  }
);
