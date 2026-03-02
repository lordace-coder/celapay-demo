import { NextRequest, NextResponse } from "next/server";
import { store, now } from "@/lib/store";
import type { ConfirmPaymentBody } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ConfirmPaymentBody;
  const txn = store.transactions.get(body.txn_id);
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.status !== "PAYMENT_SUBMITTED") {
    return NextResponse.json({ error: `Cannot confirm — status is ${txn.status}` }, { status: 400 });
  }
  const seller = store.sellers.get(txn.cela_id);
  if (seller) {
    seller.stats.awaiting = Math.max(0, seller.stats.awaiting - 1);
    if (body.confirmed) seller.stats.completed += 1;
    else seller.stats.declined += 1;
  }
  txn.status = body.confirmed ? "COMPLETED" : "DECLINED";
  txn.updated_at = now();
  return NextResponse.json(txn);
}