// =============================================================================
// SUNRISE — useUpdateCartLine mutation
// Path: src/hooks/shopify/useUpdateCartLine.ts
// Session: SBev.BC.Shopify.1
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CART_LINES_UPDATE_MUTATION,
  flattenCart,
  storefrontKeys,
  storefrontRequest,
  type Cart,
  type CartMutationResponse,
} from "../../lib/storefront";
import { useCartId } from "./useCart";

interface UpdateCartLineInput {
  lineId: string;
  quantity: number;
}

interface CartLinesUpdateResponse {
  cartLinesUpdate: Omit<CartMutationResponse, "cart"> & {
    cart: Parameters<typeof flattenCart>[0];
  };
}

export function useUpdateCartLine() {
  const queryClient = useQueryClient();
  const cartId = useCartId();

  return useMutation<Cart, Error, UpdateCartLineInput>({
    mutationFn: async ({ lineId, quantity }) => {
      if (!cartId) throw new Error("No cart to update");
      const data = await storefrontRequest<CartLinesUpdateResponse>(
        CART_LINES_UPDATE_MUTATION,
        {
          cartId,
          lines: [{ id: lineId, quantity }],
        },
      );
      const errors = data.cartLinesUpdate.userErrors;
      if (errors?.length > 0) {
        throw new Error(errors.map((e) => e.message).join("; "));
      }
      const cart = flattenCart(data.cartLinesUpdate.cart);
      if (!cart) throw new Error("cartLinesUpdate returned no cart");
      return cart;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(storefrontKeys.cartById(cart.id), cart);
      queryClient.invalidateQueries({ queryKey: storefrontKeys.cart() });
    },
  });
}