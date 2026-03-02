import { NextRequest, NextResponse } from "next/server";
import { store, now } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  const { txnId } = await params;
  const txn = store.transactions.get(txnId);
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const seller = store.sellers.get(txn.cela_id);
  if (seller) {
    seller.stats.pending = Math.max(0, seller.stats.pending - 1);
    seller.stats.declined += 1;
  }
  txn.status = "DECLINED";
  txn.updated_at = now();
  return NextResponse.json(txn);
}