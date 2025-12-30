"use client";

import { DemoAuthBasicUI, JazzReactProvider } from "jazz-tools/react";

import { JazzAccount } from "@/lib/jazz";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;
const syncPeer = apiKey
  ? (`wss://cloud.jazz.tools/?key=${apiKey}` as const)
  : ("wss://cloud.jazz.tools" as const);

export function JazzAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{ peer: syncPeer }}
      AccountSchema={JazzAccount}
      defaultProfileName="Todo Sprinter"
    >
      <DemoAuthBasicUI appName="Jazz Todo Sprint">
        {children}
      </DemoAuthBasicUI>
    </JazzReactProvider>
  );
}
