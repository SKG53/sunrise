// /box/<deal> — Build Your Box deal pages (site pass 1, Oct 28 2026).
// One component (components/BuildYourBox.tsx) for every "buy X, get Y" deal;
// this table is the only thing that changes per deal. noindex: these are
// paid/owned-channel landers (ads, emails, the wheel), kept out of search.
//
// Add a deal: add a row with a REAL Shopify code that is also listed in
// lib/deals.ts (so the cart can auto-apply it and show progress), and set the
// code's `boxPath` there so Spin & Save "Shop Now" opens it. Set
// `enabled: false` to park a page without deleting it (it 404s).
//
// Two kinds of box:
//   - buy X, get Y: paid slots + free slots (freePool says which packs).
//   - "% off N or more": paid slots = N, free slots = 0, `percent` set. The
//     deal is N OR MORE: the shopper can add more packs in the cart.
//
// Links can carry the usual UTMs. The page claims the code itself, so a
// ?code= param isn't needed here.

import { createFileRoute, notFound } from "@tanstack/react-router";
import { BuildYourBox } from "../components/BuildYourBox";

type BoxDeal = {
  enabled: boolean;
  code: string;
  paidSlots: number;
  freeSlots: number;
  freePool: "10mg" | "any";
  percent?: number;
  headline: string;
  subline: string;
  title: string;
};

const BOX_DEALS: Record<string, BoxDeal> = {
  // Spin & Save big-cart deal (NEWCUST4P1FR: buy 4 four-packs, get 1 free).
  buy4get1: {
    enabled: true,
    code: "NEWCUST4P1FR",
    paidSlots: 4,
    freeSlots: 1,
    freePool: "any",
    headline: "Buy 4. Get 1 Free.",
    subline: "Pick any four 4-packs. Your fifth one is on us.",
    title: "Buy 4 Get 1 Free",
  },
  // Spin & Save small-cart deal (NEWCUST2P10MG: buy 2, get a 10mg 4-pack free).
  buy2get10mg: {
    enabled: true,
    code: "NEWCUST2P10MG",
    paidSlots: 2,
    freeSlots: 1,
    freePool: "10mg",
    headline: "Buy 2. Get a 10mg Free.",
    subline: "Add any two 4-packs. We'll add a Perfect Buzz 10mg 4-pack, on us.",
    title: "Buy 2 Get a 10mg Free",
  },
  // Deal-specific Meta ad (AD_DEALS.b2g1f → FREE4PACK: buy 2, get 1 free).
  buy2get1: {
    enabled: true,
    code: "FREE4PACK",
    paidSlots: 2,
    freeSlots: 1,
    freePool: "any",
    headline: "Buy 2. Get 1 Free.",
    subline: "Pick any two 4-packs. The third one is on us.",
    title: "Buy 2 Get 1 Free",
  },
  // Spin & Save "N or more" % deals (site pass 2). Copy says "or more".
  "25off2": {
    enabled: true,
    code: "NEWCUST2P25",
    paidSlots: 2,
    freeSlots: 0,
    freePool: "any",
    percent: 25,
    headline: "25% Off. 2 or More.",
    subline: "Pick 2 or more 4-packs and take 25% off every one.",
    title: "25% Off 2 or More 4-Packs",
  },
  "25off5": {
    enabled: true,
    code: "NEWCUST5P25",
    paidSlots: 5,
    freeSlots: 0,
    freePool: "any",
    percent: 25,
    headline: "25% Off. 5 or More.",
    subline: "Mix and match 5 or more 4-packs and take 25% off every one.",
    title: "25% Off 5 or More 4-Packs",
  },
  "30off5": {
    enabled: true,
    code: "NEWCUST5P30",
    paidSlots: 5,
    freeSlots: 0,
    freePool: "any",
    percent: 30,
    headline: "30% Off. 5 or More.",
    subline: "Mix and match 5 or more 4-packs and take 30% off every one.",
    title: "30% Off 5 or More 4-Packs",
  },
  // Lander prototypes (/neverpull/buy1get2, /neverpull/buy3get2). PARKED:
  // no Shopify codes exist yet (prototype used TEST_B1G2 / TEST_B3G2). Create
  // the codes (buy 1 / buy 3 any 4-pack → get 2 × 10mg 4-pack 100% off), add
  // them to lib/deals.ts, put them here and flip `enabled`.
  buy1get2: {
    enabled: false,
    code: "",
    paidSlots: 1,
    freeSlots: 2,
    freePool: "10mg",
    headline: "Buy 1. Get 2 Free.",
    subline: "Add any 4-pack. We'll add two Perfect Buzz 4-packs, on us.",
    title: "Buy 1 Get 2 Free",
  },
  buy3get2: {
    enabled: false,
    code: "",
    paidSlots: 3,
    freeSlots: 2,
    freePool: "10mg",
    headline: "Buy 3. Get 2 Free.",
    subline: "Add any three 4-packs. We'll add two Perfect Buzz 4-packs, on us.",
    title: "Buy 3 Get 2 Free",
  },
};

export const Route = createFileRoute("/box/$deal")({
  loader: ({ params }) => {
    const deal = BOX_DEALS[params.deal.toLowerCase()];
    if (!deal || !deal.enabled || !deal.code) throw notFound();
    return { slug: params.deal.toLowerCase(), deal };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.deal.title ?? "Build Your Box"} · SUNRISE` },
      { name: "description", content: loaderData?.deal.subline ?? "Build your box of SUNRISE hemp-infused seltzer." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BoxPage,
});

function BoxPage() {
  const { slug, deal } = Route.useLoaderData();
  return (
    <BuildYourBox
      key={slug}
      paidSlots={deal.paidSlots}
      freeSlots={deal.freeSlots}
      freePool={deal.freePool}
      percent={deal.percent}
      headline={deal.headline}
      subline={deal.subline}
      code={deal.code}
      storageKey={`sunrise:box:${slug}`}
      logTag={slug}
    />
  );
}
