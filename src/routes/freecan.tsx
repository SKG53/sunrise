// /freecan — free-can landing page with code FREECAN. One of three copies of the
// same page (/tryfreecan = Meta ads, /webfreecan = website, /freecan = email);
// everything lives in components/FreeCanLanding.tsx, only the code differs.
// noindex: three identical paid/owned-channel landers, kept out of search.
import { createFileRoute } from "@tanstack/react-router";
import { FreeCanLanding } from "../components/FreeCanLanding";

export const Route = createFileRoute("/freecan")({
  component: () => <FreeCanLanding code="FREECAN" />,
  head: () => ({
    meta: [
      { title: "Free Can · SUNRISE" },
      { name: "description", content: "Pick any flavor or strength and the can is on us. You just cover the shipping fee." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
