import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  const { txnId } = await params;
  const txn = store.transactions.get(txnId);
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(txn);
}