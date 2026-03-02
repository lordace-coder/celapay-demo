
"use client";

import { ShoppingCart, Store, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#161514] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Secure B2B Settlement Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase leading-none">
            Institutional <br /> <span className="text-primary">Settlements</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Professional gateway for high-value B2B transactions. Manage quotes, 
            verify bank transfers, and generate receipts with real-time sync.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link href="/seller" className="group">
            <div className="h-full p-8 bg-white/[0.02] border border-white/[0.07] rounded-[2rem] hover:bg-white/[0.05] hover:border-accent/50 transition-all text-left space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Seller Console</h2>
                <p className="text-xs text-slate-500 mt-2">Onboard your business, manage high-value service catalogs, and approve settlements.</p>
              </div>
              <div className="flex items-center text-accent text-xs font-bold uppercase tracking-widest gap-2">
                Merchant Access <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/buyer" className="group">
            <div className="h-full p-8 bg-white/[0.02] border border-white/[0.07] rounded-[2rem] hover:bg-white/[0.05] hover:border-primary/50 transition-all text-left space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Buyer Gateway</h2>
                <p className="text-xs text-slate-500 mt-2">Access private storefronts via Merchant ID, request pricing, and secure purchases.</p>
              </div>
              <div className="flex items-center text-primary text-xs font-bold uppercase tracking-widest gap-2">
                Enter Storefront <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-8 opacity-40">
           <div className="flex flex-col items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Fast Sync</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Encrypted</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Verified</span>
           </div>
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-[9px] uppercase tracking-[0.3em] text-slate-700">
        Cela Gateway Protocol &copy; 2024 &middot; Settlement Interface
      </footer>
    </div>
  );
}
