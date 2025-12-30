"use client";

import { JazzReactProvider } from "jazz-tools/react";

import { JazzAccount } from "@/lib/jazz";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;
if (!apiKey) {
  throw new Error("NEXT_PUBLIC_JAZZ_API_KEY is not set");
}
const syncPeer = `wss://cloud.jazz.tools/?key=${apiKey}` as const;

export function JazzAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{ peer: syncPeer }}
      AccountSchema={JazzAccount}
      defaultProfileName="Todo Sprinter"
    >
      {children}
    </JazzReactProvider>
  );
}
