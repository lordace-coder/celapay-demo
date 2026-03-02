"use client";

import { ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isSeller = pathname?.startsWith("/seller");
  const isBuyer = pathname?.startsWith("/buyer");

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#161514]/90 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="font-display font-black text-2xl tracking-tighter uppercase">
        CELA <span className="text-primary">PAY</span>
      </Link>
      
      <div className="flex items-center gap-4">
        {isSeller && (
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 uppercase tracking-widest text-[10px] font-bold">
            Seller Console <ChevronRight className="w-3 h-3" />
          </div>
        )}
        {isBuyer && (
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 uppercase tracking-widest text-[10px] font-bold">
            Buyer Gateway <ChevronRight className="w-3 h-3" />
          </div>
        )}
        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-white">
          <Link href="/">
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Home
          </Link>
        </Button>
      </div>
    </header>
  );
}
