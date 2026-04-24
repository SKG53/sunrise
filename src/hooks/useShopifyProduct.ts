import { useEffect, useState } from "react";
import { fetchProductByHandle, type ShopifyProduct } from "@/lib/shopify";

type State = {
  product: ShopifyProduct | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetch a single Shopify product by handle. Returns loading + error states.
 * Pass null/undefined to skip fetching.
 */
export function useShopifyProduct(handle: string | null | undefined): State {
  const [state, setState] = useState<State>({
    product: null,
    loading: !!handle,
    error: null,
  });

  useEffect(() => {
    if (!handle) {
      setState({ product: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchProductByHandle(handle)
      .then((product) => {
        if (cancelled) return;
        setState({ product, loading: false, error: product ? null : "Product not found" });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch Shopify product:", err);
        setState({ product: null, loading: false, error: err.message ?? "Unknown error" });
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return state;
}