"use client";

import { createContext, useContext } from "react";
import type { MeResponse } from "@/lib/types";

const UserContext = createContext<MeResponse | null>(null);

export function UserProvider({ value, children }: { value: MeResponse; children: React.ReactNode }) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): MeResponse {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
