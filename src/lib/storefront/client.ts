// =============================================================================
// SUNRISE — Storefront API GraphQL client
// Path: src/lib/storefront/client.ts
// Session: SBev.BC.Shopify.1
//
// Minimal GraphQL client for Shopify Storefront API. Defaults to mock.shop.
// Swap VITE_STOREFRONT_API_URL and VITE_STOREFRONT_ACCESS_TOKEN to target a real store.
// =============================================================================

const API_URL = import.meta.env.VITE_STOREFRONT_API_URL ?? "https://mock.shop/api";
const ACCESS_TOKEN = import.meta.env.VITE_STOREFRONT_ACCESS_TOKEN;

export class StorefrontError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "StorefrontError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[]; extensions?: Record<string, unknown> }>;
}

/**
 * Execute a GraphQL query or mutation against the Storefront API.
 * Throws StorefrontError on network failure or GraphQL errors.
 */
export async function storefrontRequest<TData, TVars = Record<string, unknown>>(
  query: string,
  variables?: TVars,
): Promise<TData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Only sent when targeting a real Shopify store. mock.shop ignores this header.
  if (ACCESS_TOKEN) {
    headers["X-Shopify-Storefront-Access-Token"] = ACCESS_TOKEN;
  }

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    throw new StorefrontError(
      `Network error calling Storefront API at ${API_URL}`,
      err,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new StorefrontError(
      `Storefront API returned ${response.status} ${response.statusText}`,
      text,
    );
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors && payload.errors.length > 0) {
    throw new StorefrontError(
      `GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`,
      payload.errors,
    );
  }

  if (!payload.data) {
    throw new StorefrontError("Storefront API returned no data");
  }

  return payload.data;
}

export const storefrontConfig = {
  apiUrl: API_URL,
  hasAccessToken: Boolean(ACCESS_TOKEN),
};