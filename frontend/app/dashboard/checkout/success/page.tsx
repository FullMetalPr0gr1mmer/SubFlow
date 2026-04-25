"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center animate-fade-in">
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Payment successful!</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Your subscription is now active. We'll redirect you back to your dashboard in a few seconds.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
