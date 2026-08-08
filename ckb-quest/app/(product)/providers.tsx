"use client";

import { Provider } from "@ckb-ccc/connector-react";
import { ccc } from "@ckb-ccc/core";

const testnetClient = new ccc.ClientPublicTestnet();

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider defaultClient={testnetClient}>{children}</Provider>;
}
