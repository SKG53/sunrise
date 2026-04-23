// =============================================================================
// SUNRISE — S07Map.tsx
// Path: src/components/S07Map.tsx
//
// Homepage "Find Near You" map teaser. Renders an interactive-looking but
// interaction-locked Leaflet map with CartoDB Positron tiles and brand-styled
// pins marking placeholder retail cities. Real interaction (drag, zoom, pin
// click) lives on the /find page — this is a visual hook only.
//
// LOADING STRATEGY
//   This component is entirely self-contained: on mount it injects both the
//   Leaflet stylesheet and the Leaflet script into document.head (once per
//   page lifecycle, guarded against double-loads via a module-level promise).
//   This avoids adding Leaflet as a package dependency and sidesteps SSR/
//   bundling gotchas — Leaflet touches `window` at import time, which can
//   break server-side rendering if imported the conventional way.
//
// REPLACING PLACEHOLDER PINS
//   Swap the PINS array below when a real retail-locations list is available.
//   Each pin is a { city, lat, lng }. Extending to richer data (name, address,
//   phone, hours) is additive.
// =============================================================================

import { useEffect, useRef } from "react";

// Placeholder rollout cities — central US anchored on SUNRISE HQ (Tulsa, OK),
// with regional expansion markers. To be replaced with real locations.
const PINS: ReadonlyArray<{ city: string; lat: number; lng: number }> = [
  { city: "Tulsa, OK",         lat: 36.1540, lng:  -95.9928 },
  { city: "Oklahoma City, OK", lat: 35.4676, lng:  -97.5164 },
  { city: "Austin, TX",        lat: 30.2672, lng:  -97.7431 },
  { city: "Dallas, TX",        lat: 32.7767, lng:  -96.7970 },
  { city: "Denver, CO",        lat: 39.7392, lng: -104.9903 },
  { city: "Kansas City, MO",   lat: 39.0997, lng:  -94.5786 },
  { city: "Phoenix, AZ",       lat: 33.4484, lng: -112.0740 },
  { city: "Nashville, TN",     lat: 36.1627, lng:  -86.7816 },
  { city: "Portland, OR",      lat: 45.5152, lng: -122.6784 },
];

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS  = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

// Module-level cache so mount/unmount/remount does not re-inject scripts.
let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") {
    // SSR-safe no-op — real loading happens on the client after hydration.
    return Promise.resolve(null);
  }
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<any>((resolve, reject) => {
    // Inject the stylesheet if not already present.
    if (!document.getElementById("sunrise-leaflet-css")) {
      const link = document.createElement("link");
      link.id = "sunrise-leaflet-css";
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Inject the script; resolve / reject based on its load lifecycle.
    const existing = document.getElementById("sunrise-leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      // Another instance is loading it — poll for completion.
      const started = Date.now();
      const tick = () => {
        if ((window as any).L) return resolve((window as any).L);
        if (Date.now() - started > 5000) return reject(new Error("Leaflet load timeout"));
        setTimeout(tick, 50);
      };
      return tick();
    }

    const script = document.createElement("script");
    script.id = "sunrise-leaflet-js";
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => {
      if ((window as any).L) resolve((window as any).L);
      else reject(new Error("Leaflet script loaded but window.L is undefined"));
    };
    script.onerror = () => reject(new Error("Failed to load Leaflet from CDN"));
    document.head.appendChild(script);
  });

  return leafletPromise;
}

export function S07Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !L || !mapRef.current) return;

        // Center chosen so Tulsa sits slightly below-center and both coastal
        // pins (Portland OR / Nashville TN) fit the viewport without clipping
        // at zoom 4. Zoom is locked — country-scale view only.
        map = L.map(mapRef.current, {
          center: [38.5, -96.5],
          zoom: 4,
          minZoom: 4,
          maxZoom: 4,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: false,
          attributionControl: false,
        });

        // CartoDB Positron — clean pale basemap, no API key required for
        // reasonable traffic. At production scale we'd migrate to a paid
        // tile provider (Mapbox) or self-host tiles.
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            subdomains: "abcd",
            maxZoom: 20,
          },
        ).addTo(map);

        // Brand-styled pins via divIcon — pure HTML/CSS, no sprites or
        // bundler icon-path quirks, full theming control.
        const pinIcon = L.divIcon({
          className: "s07-pin",
          html: '<div class="s07-pin-inner"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        PINS.forEach((p) => {
          L.marker([p.lat, p.lng], {
            icon: pinIcon,
            interactive: false,
            keyboard: false,
          }).addTo(map);
        });
      })
      .catch((err) => {
        // Non-fatal: if Leaflet fails to load, the map simply doesn't render.
        // The cream "Find SUNRISE near you" card still displays and users
        // can click through to the /find page.
        // eslint-disable-next-line no-console
        console.warn("[S07Map]", err);
      });

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = null;
      }
    };
  }, []);

  // Class `s08-map-bg` retained so existing layout rules (position: absolute;
  // inset: 0) apply without needing duplicate styles.
  return <div ref={mapRef} className="s08-map-bg" aria-hidden="true" />;
}
