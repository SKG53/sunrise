// =============================================================================
// SUNRISE — useRemoveCartLine mutation
// Path: src/hooks/shopify/useRemoveCartLine.ts
// Session: SBev.BC.Shopify.1
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CART_LINES_REMOVE_MUTATION,
  flattenCart,
  storefrontKeys,
  storefrontRequest,
  type Cart,
  type CartMutationResponse,
} from "../../lib/storefront";
import { useCartId } from "./useCart";

interface RemoveCartLineInput {
  lineId: string;
}

interface CartLinesRemoveResponse {
  cartLinesRemove: Omit<CartMutationResponse, "cart"> & {
    cart: Parameters<typeof flattenCart>[0];
  };
}

export function useRemoveCartLine() {
  const queryClient = useQueryClient();
  const cartId = useCartId();

  return useMutation<Cart, Error, RemoveCartLineInput>({
    mutationFn: async ({ lineId }) => {
      if (!cartId) throw new Error("No cart to update");
      const data = await storefrontRequest<CartLinesRemoveResponse>(
        CART_LINES_REMOVE_MUTATION,
        {
          cartId,
          lineIds: [lineId],
        },
      );
      const errors = data.cartLinesRemove.userErrors;
      if (errors?.length > 0) {
        throw new Error(errors.map((e) => e.message).join("; "));
      }
      const cart = flattenCart(data.cartLinesRemove.cart);
      if (!cart) throw new Error("cartLinesRemove returned no cart");
      return cart;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(storefrontKeys.cartById(cart.id), cart);
      queryClient.invalidateQueries({ queryKey: storefrontKeys.cart() });
    },
  });
}