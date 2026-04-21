// =============================================================================
// SUNRISE — useAddToCart mutation
// Path: src/hooks/shopify/useAddToCart.ts
// Session: SBev.BC.Shopify.1
//
// Two-mode mutation:
//   - If no cart exists yet (no cart ID in localStorage): call cartCreate with
//     the line as the initial lines[] — one round trip.
//   - If a cart exists: call cartLinesAdd with the cart ID and the new line.
//
// On success: persist the new cart ID (if it changed) and invalidate the cart
// query so useCart() consumers re-render with fresh data.
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  flattenCart,
  storefrontKeys,
  storefrontRequest,
  type Cart,
  type CartMutationResponse,
} from "../../lib/storefront";
import { setCartId, useCartId } from "./useCart";

interface AddToCartInput {
  variantId: string;
  quantity?: number;
}

interface CartCreateResponse {
  cartCreate: Omit<CartMutationResponse, "cart"> & {
    cart: Parameters<typeof flattenCart>[0];
  };
}

interface CartLinesAddResponse {
  cartLinesAdd: Omit<CartMutationResponse, "cart"> & {
    cart: Parameters<typeof flattenCart>[0];
  };
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const cartId = useCartId();

  return useMutation<Cart, Error, AddToCartInput>({
    mutationFn: async ({ variantId, quantity = 1 }) => {
      // CASE 1: no cart yet — create one with the first line.
      if (!cartId) {
        const data = await storefrontRequest<CartCreateResponse>(
          CART_CREATE_MUTATION,
          {
            input: {
              lines: [{ merchandiseId: variantId, quantity }],
            },
          },
        );
        const errors = data.cartCreate.userErrors;
        if (errors?.length > 0) {
          throw new Error(errors.map((e) => e.message).join("; "));
        }
        const cart = flattenCart(data.cartCreate.cart);
        if (!cart) throw new Error("cartCreate returned no cart");
        setCartId(cart.id);
        return cart;
      }

      // CASE 2: existing cart — append line.
      const data = await storefrontRequest<CartLinesAddResponse>(
        CART_LINES_ADD_MUTATION,
        {
          cartId,
          lines: [{ merchandiseId: variantId, quantity }],
        },
      );
      const errors = data.cartLinesAdd.userErrors;
      if (errors?.length > 0) {
        throw new Error(errors.map((e) => e.message).join("; "));
      }
      const cart = flattenCart(data.cartLinesAdd.cart);
      if (!cart) throw new Error("cartLinesAdd returned no cart");
      return cart;
    },
    onSuccess: (cart) => {
      // Seed the cache with the returned cart so the UI updates immediately,
      // then invalidate to trigger a refetch and keep the cache honest.
      queryClient.setQueryData(storefrontKeys.cartById(cart.id), cart);
      queryClient.invalidateQueries({ queryKey: storefrontKeys.cart() });
    },
  });
}