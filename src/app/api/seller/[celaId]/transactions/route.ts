import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ celaId: string }> }
) {
  const { celaId } = await params;
  const transactions = Array.from(store.transactions.values()).filter(
    (t) => t.cela_id === celaId
  );
  return NextResponse.json({ transactions });
}