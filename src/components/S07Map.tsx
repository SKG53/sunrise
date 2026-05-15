// Homepage "Find Near You" map teaser. Renders Google Maps with the states
// where SUNRISE is sold filled in tier-30 green via the Maps Data Layer.
// No store-level data is exposed — users click through to /find for that.
// Interaction is fully locked (no drag, no zoom, no UI controls); this is
// a visual hook only.
//
// Visual logic
//   - Basemap: same MAP_STYLE as before (muted warm palette).
//   - State coverage: loaded from /data/coverage-states.geojson via the
//     Data Layer. Each feature is filled tier-30 green at ~70% opacity
//     with a hairline cream stroke. No markers.
//   - Viewport: shifted ~10° east of the prior center so the highlighted
//     coverage states (TX → ME, clustered in the central-east US) sit
//     clear of the floating .s08-card overlay on the left.
//
// Data source: /public/data/coverage-states.geojson (built from the same
// US Census GeoJSON used elsewhere; trimmed to the 9 coverage states).

import { useEffect, useRef } from "react";
import { loadGoogleMaps, MAP_STYLE } from "../lib/googleMaps";

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
          // Center shifted west of the prior -96.5°W so the coverage states
          // slide rightward in the frame, pulling Texas/Oklahoma/Kansas/Missouri
          // out from behind the floating .s08-card on the left.
          center: { lat: 38.5, lng: -105 },
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

        // Load the 9-state coverage GeoJSON into the map's Data Layer.
        // The Data Layer is part of the standard Maps JavaScript API; no
        // additional API enablement required. loadGeoJson resolves async,
        // but if it fails the map still renders cleanly (no overlay).
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
