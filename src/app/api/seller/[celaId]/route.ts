import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ celaId: string }> }
) {
  const { celaId } = await params;
  const seller = store.sellers.get(celaId);
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(seller);
}