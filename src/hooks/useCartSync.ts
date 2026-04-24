import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

/**
 * Sync local cart state with Shopify when the page loads or the user returns
 * to the tab. Clears the local cart if the Shopify cart is empty
 * (i.e. checkout completed in another tab).
 */
export function useCartSync() {
  const syncCart = useCartStore((state) => state.syncCart);

  useEffect(() => {
    syncCart();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [syncCart]);
}