// =============================================================================
// SUNRISE — useProduct hook
// Path: src/hooks/shopify/useProduct.ts
// Session: SBev.BC.Shopify.1
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import {
  PRODUCT_BY_HANDLE_QUERY,
  flattenProduct,
  storefrontKeys,
  storefrontRequest,
  type Product,
} from "../../lib/storefront";

interface ProductByHandleRaw {
  product: Parameters<typeof flattenProduct>[0];
}

/**
 * Fetch a single product by its Shopify handle.
 * Returns null if the product does not exist.
 */
export function useProduct(handle: string | undefined) {
  return useQuery<Product | null>({
    queryKey: storefrontKeys.product(handle ?? ""),
    enabled: Boolean(handle),
    queryFn: async () => {
      const data = await storefrontRequest<ProductByHandleRaw>(
        PRODUCT_BY_HANDLE_QUERY,
        { handle },
      );
      return flattenProduct(data.product);
    },
    staleTime: 60_000, // 1 minute — products don't change often
  });
}