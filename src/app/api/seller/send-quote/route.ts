import { NextRequest, NextResponse } from "next/server";
import { store, now } from "@/lib/store";
import type { SendQuoteBody } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SendQuoteBody;
  const txn = store.transactions.get(body.txn_id);
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (txn.status !== "PENDING") {
    return NextResponse.json({ error: `Cannot send quote — status is ${txn.status}` }, { status: 400 });
  }
  const seller = store.sellers.get(txn.cela_id);
  if (seller) {
    seller.stats.pending = Math.max(0, seller.stats.pending - 1);
    seller.stats.awaiting += 1;
  }
  txn.status = "AWAITING";
  txn.amount = body.amount;
  txn.notes = body.notes;
  txn.bank_details = {
    bank_name: body.bank_name,
    account_name: body.account_name,
    account_number: body.account_number,
    routing_number: body.routing_number,
  };
  txn.updated_at = now();
  return NextResponse.json(txn);
}