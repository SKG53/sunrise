// =============================================================================
// SUNRISE — S07Map.tsx
// Path: src/components/S07Map.tsx
//
// Homepage "Find Near You" map teaser. Renders Google Maps with nine brand-
// styled markers for placeholder rollout cities. Interaction is fully locked
// (no drag, no zoom, no UI controls) — this is a visual hook only. The real
// interactive locator lives on the /find page.
//
// API KEY NOTES
//   The Maps JavaScript API is a client-side product: the key is visible
//   in the browser by design. Security is enforced server-side by Google
//   via the HTTP Referer restriction on the key. This key is restricted
//   to: savorsunrise.com, *.savorsunrise.com, *.lovable.app,
//   *.lovableproject.com, localhost. Requests from any other origin are
//   rejected by Google's servers regardless of what code runs here.
//   Rotating the key is safe if ever needed — change the constant below
//   and redeploy.
//
// LOADING STRATEGY
//   Google Maps JS is injected from the Maps CDN at runtime (this
//   component owns the <script> tag). Module-level promise guards against
//   double-injection on remount. SSR-safe (no window access at module
//   scope). Graceful degradation: if the CDN fails, the map doesn't
//   render but the cream overlay card and CTA still work.
//
// REPLACING PLACEHOLDER PINS
//   Swap the PINS array below when a real retail-locations list exists.
// =============================================================================

import { useEffect, useRef } from "react";

// Domain-restricted public key — safe to embed per Google's client-side
// Maps model. See API KEY NOTES above.
const GOOGLE_MAPS_API_KEY = "AIzaSyCjWZ3tjPQ5jARXQx0LxSuQuIcvExXZbAc";

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

// Custom map style — heavily muted palette tuned for SUNRISE cream (#FEFBE0).
// Neutralizes all colors toward warm tones, hides most POI labels, keeps
// roads subtle. Typed as any[] because this project does not include
// @types/google.maps (avoiding a dependency add).
const MAP_STYLE: any[] = [
  { elementType: "geometry",        stylers: [{ color: "#f5f3ed" }] },
  { elementType: "labels.icon",     stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8478" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f3ed" }] },
  { featureType: "administrative.country",   elementType: "geometry.stroke", stylers: [{ color: "#c8c4ba" }] },
  { featureType: "administrative.province",  elementType: "geometry.stroke", stylers: [{ color: "#d8d4ca" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi",             stylers: [{ visibility: "off" }] },
  { featureType: "road",            elementType: "geometry",        stylers: [{ color: "#ebe7dd" }] },
  { featureType: "road.arterial",   elementType: "labels",          stylers: [{ visibility: "off" }] },
  { featureType: "road.highway",    elementType: "geometry",        stylers: [{ color: "#e0dcd0" }] },
  { featureType: "road.highway",    elementType: "labels",          stylers: [{ visibility: "off" }] },
  { featureType: "road.local",      elementType: "labels",          stylers: [{ visibility: "off" }] },
  { featureType: "transit",         stylers: [{ visibility: "off" }] },
  { featureType: "water",           elementType: "geometry",        stylers: [{ color: "#dcdccf" }] },
  { featureType: "water",           elementType: "labels.text.fill", stylers: [{ color: "#9a9488" }] },
];

// Module-level promise cache so mount/unmount/remount does not re-inject
// the Google Maps script.
let mapsPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  const w = window as any;
  if (w.google && w.google.maps) return Promise.resolve(w.google.maps);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise<any>((resolve, reject) => {
    const existing = document.getElementById("sunrise-google-maps-js") as HTMLScriptElement | null;
    if (existing) {
      const started = Date.now();
      const tick = () => {
        if (w.google && w.google.maps) return resolve(w.google.maps);
        if (Date.now() - started > 8000) return reject(new Error("Google Maps load timeout"));
        setTimeout(tick, 50);
      };
      return tick();
    }

    // Use a unique global callback name to avoid collisions.
    const callbackName = "__sunriseGoogleMapsReady";
    (window as any)[callbackName] = () => {
      if (w.google && w.google.maps) resolve(w.google.maps);
      else reject(new Error("Google Maps script loaded but google.maps is undefined"));
      delete (window as any)[callbackName];
    };

    const script = document.createElement("script");
    script.id = "sunrise-google-maps-js";
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}` +
      `&callback=${callbackName}&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps from CDN"));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

export function S07Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Google Maps doesn't offer a .remove() on the map instance; cleanup
    // clears the container DOM on unmount.
    const containerNode = mapRef.current;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !maps || !containerNode) return;

        const map = new maps.Map(containerNode, {
          center: { lat: 38.5, lng: -96.5 },
          zoom: 4,
          minZoom: 4,
          maxZoom: 4,
          // All interaction disabled — teaser map, not a tool.
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

        // Brand-styled pin: tier-30 green (#0A6034) circle with cream
        // border. Using the symbol-path API so the marker is vector, not
        // a raster sprite — renders crisp at any pixel density.
        const pinIcon: any = {
          path: maps.SymbolPath.CIRCLE,
          fillColor: "#0A6034",
          fillOpacity: 1,
          strokeColor: "#FEFBE0",
          strokeWeight: 2,
          scale: 7,
        };

        PINS.forEach((p) => {
          new maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            icon: pinIcon,
            clickable: false,
            title: p.city,
          });
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[S07Map]", err);
      });

    return () => {
      cancelled = true;
      // Best-effort cleanup — clear container to release map DOM.
      if (containerNode) containerNode.innerHTML = "";
    };
  }, []);

  // Class `s08-map-bg` retained so existing layout rules (position: absolute;
  // inset: 0) apply without duplicate styles.
  return <div ref={mapRef} className="s08-map-bg" aria-hidden="true" />;
}
