// Shared Google Maps loader and brand map style. Consumed by:
//   - src/components/S07Map.tsx  (home-page US overview map)
//   - src/routes/find.tsx        (full interactive store locator)
//
// API KEY NOTES
//   The Maps JavaScript API is a client-side product: the key is visible
//   in the browser by design. Security is enforced server-side by Google
//   via the HTTP Referer restriction on the key. This key is restricted
//   to: savorsunrise.com, *.savorsunrise.com, *.lovable.app,
//   *.lovableproject.com, localhost. Requests from any other origin are
//   rejected by Google's servers regardless of what code runs here.
//   Rotating the key is safe if ever needed — change the constant below.
//
// LOADING STRATEGY
//   Google Maps JS is injected from the Maps CDN at runtime. Module-level
//   promise guards against double-injection across components and remounts.
//   SSR-safe (no window access at module scope; all window touches happen
//   inside loadGoogleMaps()). Graceful degradation: if the CDN fails, the
//   caller's catch block handles it.
// =============================================================================

// Domain-restricted public key — safe to embed per Google's client-side
// Maps model. See API KEY NOTES above.
export const GOOGLE_MAPS_API_KEY = "AIzaSyCjWZ3tjPQ5jARXQx0LxSuQuIcvExXZbAc";

// Custom map style — heavily muted palette tuned for SUNRISE cream (#FEFBE0).
// Neutralizes all colors toward warm tones, hides most POI labels, keeps
// roads subtle. Typed as any[] because this project does not include
// @types/google.maps (avoiding a dependency add).
export const MAP_STYLE: any[] = [
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

// Module-level promise cache so mount/unmount/remount across components
// does not re-inject the Google Maps script.
let mapsPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
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

    // Unique global callback name to avoid collisions.
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
