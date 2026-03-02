import { NextRequest, NextResponse } from "next/server";
import { store, now } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  const { txnId } = await params;
  const txn = store.transactions.get(txnId);
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.status !== "AWAITING") {
    return NextResponse.json({ error: "Not awaiting payment" }, { status: 400 });
  }
  txn.status = "PAYMENT_SUBMITTED";
  txn.updated_at = now();
  return NextResponse.json(txn);
}