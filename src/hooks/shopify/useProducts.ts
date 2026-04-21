// =============================================================================
// SUNRISE — useProducts hook
// Path: src/hooks/shopify/useProducts.ts
// Session: SBev.BC.Shopify.1
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import {
  PRODUCTS_QUERY,
  flattenProducts,
  storefrontKeys,
  storefrontRequest,
  type Product,
} from "../../lib/storefront";

interface ProductsRaw {
  products: Parameters<typeof flattenProducts>[0];
}

interface UseProductsOptions {
  first?: number;
  query?: string;
}

/**
 * Fetch a list of products from the Storefront API.
 * Defaults to first 20. Pass `query` for search/filter (Shopify query string syntax).
 */
export function useProducts({ first = 20, query }: UseProductsOptions = {}) {
  return useQuery<Product[]>({
    queryKey: storefrontKeys.productsList(query),
    queryFn: async () => {
      const data = await storefrontRequest<ProductsRaw>(PRODUCTS_QUERY, {
        first,
        query,
      });
      return flattenProducts(data.products);
    },
    staleTime: 60_000,
  });
}