import { NextRequest, NextResponse } from "next/server";
import { store, genId, now } from "@/lib/store";
import type { OnboardRequest, OnboardResponse, Seller } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as OnboardRequest;
  if (!body.business_name || !body.seller_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const cela_id = genId("CELA-");
  const seller: Seller = {
    cela_id,
    business_name: body.business_name,
    seller_name: body.seller_name,
    category: body.category,
    products: body.products,
    created_at: now(),
    stats: { pending: 0, awaiting: 0, completed: 0, declined: 0 },
  };
  store.sellers.set(cela_id, seller);
  const res: OnboardResponse = { cela_id, message: "Storefront live!" };
  return NextResponse.json(res);
}