import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ celaId: string }> }
) {
  const { celaId } = await params;
  if (!store.sellers.has(celaId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const base = req.nextUrl.origin;
  return NextResponse.json({ link: `${base}/quote/${celaId}` });
}