// Legacy address for the review page — /reviewsubmit was live briefly on
// 2026-10-02 before the page moved to /submitreview. Permanently redirects,
// keeping the query string (?v=, ?product=, ?order=) so any stray link still
// lands on the form with its parameters intact.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reviewsubmit")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/submitreview${location.searchStr}`, statusCode: 301 });
  },
});
