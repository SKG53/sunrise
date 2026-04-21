// =============================================================================
// SUNRISE — TanStack Query provider
// Path: src/components/shopify/QueryProvider.tsx
// Session: SBev.BC.Shopify.1
//
// Wraps the app in a QueryClientProvider. The client is instantiated once per
// render tree via useState so SSR (one client per request) and client hydration
// (one client per tab, preserved across navigation) both work correctly.
// =============================================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on window focus — most Shopify data is stable enough.
        // Cart still refetches on invalidation (staleTime: 0 on useCart).
        refetchOnWindowFocus: false,
        // Retry once on failure, not three times.
        retry: 1,
        // Keep data in cache for 5 minutes after last subscriber unmounts.
        gcTime: 5 * 60 * 1000,
      },
    },
  });
}

// Browser singleton — preserved across tab navigation within the SPA.
// On the server, we want a fresh client per request to avoid cross-request leaks.
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always new
    return makeQueryClient();
  }
  // Browser: singleton
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState with initializer so we don't re-create the client on re-render
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}