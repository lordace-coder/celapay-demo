import { NextRequest, NextResponse } from "next/server";
import { store, genId, now } from "@/lib/store";
import type { QuoteRequestBody, Transaction } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as QuoteRequestBody;
  const seller = store.sellers.get(body.cela_id);
  if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  const txn_id = genId("TXN-");
  const txn: Transaction = {
    txn_id,
    cela_id: body.cela_id,
    seller_name: seller.business_name,
    buyer_name: body.buyer_name,
    product_name: body.product_name,
    quantity: body.quantity,
    message: body.message ?? "",
    status: "PENDING",
    amount: null,
    bank_details: null,
    created_at: now(),
    updated_at: now(),
  };
  store.transactions.set(txn_id, txn);
  seller.stats.pending += 1;
  return NextResponse.json(txn);
}