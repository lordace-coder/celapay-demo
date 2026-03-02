import type { Seller, Transaction } from "@/types";

// Global in-memory store — persists across hot-reloads in dev via globalThis
declare global {
  // eslint-disable-next-line no-var
  var __celaStore: { sellers: Map<string, Seller>; transactions: Map<string, Transaction> } | undefined;
}

if (!globalThis.__celaStore) {
  globalThis.__celaStore = {
    sellers: new Map<string, Seller>(),
    transactions: new Map<string, Transaction>(),
  };
}

export const store = globalThis.__celaStore;

export function genId(prefix: string, len = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}${rand}`;
}

export function now(): string {
  return new Date().toISOString();
}