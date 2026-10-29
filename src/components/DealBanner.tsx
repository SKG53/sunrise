// /products deal banner (site pass 2). Shows the shopper's ACTIVE saved deal
// (lib/dealWallet.ts) in plain words, so a "% off anything" winner landing
// here from Spin & Save knows the deal is already working:
//   SRSPINWIN15OFF → "Your 15% off applies automatically to 4, 12 and 20 packs."
// Box deals link to their Build Your Box page. Renders nothing when there's
// no active deal (and nothing on the server: the wallet is client-only).
// No timing language, no shipping price.

import { useEffect, useState } from "react";
import { dealByCode } from "../lib/deals";
import { getActiveCode, WALLET_EVENT } from "../lib/dealWallet";
import "./DealBanner.css";

export function DealBanner() {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setCode(getActiveCode());
    sync();
    window.addEventListener(WALLET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WALLET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const rule = dealByCode(code);
  if (!rule) return null;
  return (
    <div className="deal-banner" role="status">
      <div className="deal-banner-inner">
        <span className="deal-banner-text">{rule.banner}</span>
        {rule.boxPath && (
          <a className="deal-banner-link" href={rule.boxPath}>
            Build your box →
          </a>
        )}
      </div>
    </div>
  );
}
