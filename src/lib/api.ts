
import { Seller, Transaction, Product } from "./types";

/**
 * API Service Layer
 * Replace these mock implementations with calls to your FastAPI backend.
 */

export async function fetchSeller(sellerId: string): Promise<Seller | null> {
  console.log("Fetching seller:", sellerId);
  // Mock implementation using localStorage for testing UI flow
  const data = localStorage.getItem(`seller_${sellerId}`);
  return data ? JSON.parse(data) : null;
}

export async function onboardSeller(seller: Seller): Promise<void> {
  console.log("Onboarding seller:", seller);
  localStorage.setItem(`seller_${seller.cela_id}`, JSON.stringify(seller));
}

export async function fetchTransactions(sellerId: string): Promise<Transaction[]> {
  console.log("Fetching transactions for seller:", sellerId);
  const all = localStorage.getItem("transactions");
  const txns: Transaction[] = all ? JSON.parse(all) : [];
  return txns.filter(t => t.seller_id === sellerId);
}

export async function fetchTransaction(txnId: string): Promise<Transaction | null> {
  const all = localStorage.getItem("transactions");
  const txns: Transaction[] = all ? JSON.parse(all) : [];
  return txns.find(t => t.txn_id === txnId) || null;
}

export async function createTransaction(txn: Omit<Transaction, "txn_id">): Promise<string> {
  const txnId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const newTxn = { ...txn, txn_id: txnId };
  
  const all = localStorage.getItem("transactions");
  const txns = all ? JSON.parse(all) : [];
  txns.push(newTxn);
  localStorage.setItem("transactions", JSON.stringify(txns));
  
  return txnId;
}

export async function updateTransactionStatus(txnId: string, status: Transaction["status"], additionalData?: Partial<Transaction>): Promise<void> {
  const all = localStorage.getItem("transactions");
  let txns: Transaction[] = all ? JSON.parse(all) : [];
  txns = txns.map(t => t.txn_id === txnId ? { ...t, status, ...additionalData } : t);
  localStorage.setItem("transactions", JSON.stringify(txns));
}

export async function generateAIAssistedNote(input: { productName: string; buyerMessage: string }): Promise<string> {
  // Replace this with a call to your FastAPI /ai endpoint
  return `Thank you for your interest in ${input.productName}. We have reviewed your request and are happy to provide this quote. Please let us know if you have any further questions.`;
}
