// State-level coverage page. Shows where SUNRISE is currently sold via the
// same state-polygon map used on the home page, plus the standing wholesale
// and shop CTAs. No search, no retailer list, no store-level data — the
// retailer database in src/data/retailers.ts is fabricated placeholder and
// is not exposed here.
//
// Composition:
//   1. f-pagehero  — dark band, staggered "FIND US" headline
//   2. f-hero      — section headline + subhead
//   3. f-coverage  — Google Maps with the 9 coverage states filled
//                    (tier-30 green polygons via the Data Layer, loaded
//                    from /data/coverage-states.geojson — same source as
//                    the home-page S07Map component)
//   4. f-fallback  — "No store nearby? No problem" — Shop / About CTAs
//   5. f-gateway   — Wholesale inquiries CTA
//
// SEO — robots noindex,nofollow was previously set because the page exposed
// fabricated retailer data. With retailer data removed, the page is now a
// truthful coverage view. Removing the noindex entry so search engines can
// index it.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { loadGoogleMaps, MAP_STYLE } from "../lib/googleMaps";
import "./find.css";

export const Route = createFileRoute("/find")({
  component: FindPage,
  head: () => ({
    meta: [
      { title: "Find · SUNRISE" },
      {
        name: "description",
        content:
          "Where to find SUNRISE. Available at independent retailers across nine states and growing.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/find" },
    ],
  }),
});

function FindPage() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const containerNode = mapRef.current;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !maps || !containerNode) return;

        const map = new maps.Map(containerNode, {
          // Standard US-overview center — no overlay to clear on this page,
          // so the geographic center stays centered.
          center: { lat: 38.5, lng: -96.5 },
          zoom: 4,
          minZoom: 4,
          maxZoom: 4,
          // All interaction disabled — this is a coverage display, not a
          // locator. Same lock-down as the home-page S07Map.
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          scaleControl: false,
          keyboardShortcuts: false,
          clickableIcons: false,
          gestureHandling: "none",
          disableDefaultUI: true,
          styles: MAP_STYLE,
          backgroundColor: "#f5f3ed",
        });

        // Load the 9-state coverage GeoJSON into the map's Data Layer.
        // Same source file the home-page S07Map consumes; one canonical
        // dataset, two surfaces.
        map.data.setStyle({
          fillColor: "#0A6034",
          fillOpacity: 0.7,
          strokeColor: "#FEFBE0",
          strokeWeight: 1,
          clickable: false,
        });
        map.data.loadGeoJson("/data/coverage-states.geojson");
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[FindMap]", err);
      });

    return () => {
      cancelled = true;
      if (containerNode) containerNode.innerHTML = "";
    };
  }, []);

  return (
    <>
      <SiteHeader activeNav="find" />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="f-pagehero">
          <h1 className="f-pagehero-title" aria-label="Find Us">
            {"Find Us".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
        <section className="f-hero">
          <div className="container">
            <div className="f-hero-inner">
              <h1 className="f-hero-headline">
                Find SUNRISE<br />
                <span className="accent">Near you</span>
              </h1>
              <p className="f-hero-body">
                Available at independent retailers across nine states. A full
                store locator is coming soon.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 · COVERAGE MAP ─────────────────────────────────────────── */}
        {/* Same state polygons + same GeoJSON as the home-page teaser, but */}
        {/* given a full-width frame here with no overlapping card. The map */}
        {/* fills .f-coverage-map at a 16:9 aspect ratio so all nine states */}
        {/* are visible without crowding.                                    */}
        <section className="f-coverage">
          <div className="container">
            <div ref={mapRef} className="f-coverage-map" aria-hidden="true" />
          </div>
        </section>

        {/* ── 04 · FALLBACK ─────────────────────────────────────────────── */}
        <section className="f-fallback">
          <div className="container">
            <div className="f-fallback-inner">
              <div className="f-fallback-copy">
                <h2 className="f-fallback-headline">
                  No store nearby? No problem
                </h2>
                <p className="f-fallback-body">
                  Order SUNRISE direct to your door — or get to know us first.
                </p>
              </div>
              <div className="f-fallback-ctas">
                <a href="/products" className="btn btn-on-color">
                  Shop Online
                </a>
                <a href="/about" className="btn btn-on-color-ghost">
                  Our Story
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · RETAILER GATEWAY (cream band) ─────────────────────────── */}
        <section className="f-gateway">
          <div className="container">
            <div className="f-gateway-inner">
              <div className="f-gateway-left">
                <h2 className="f-gateway-headline">
                  Let's stock <span className="accent">your</span> shelves
                </h2>
                <p className="f-gateway-body">
                  Wholesale inquiries welcome. Small-batch craft, full-panel
                  testing, dependable supply — built for retailers who care
                  about what they carry.
                </p>
              </div>
              <div className="f-gateway-right">
                <a href="/contact?topic=wholesale" className="btn btn-primary">
                  Wholesale Inquiries
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
