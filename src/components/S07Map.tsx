// Homepage "Find Near You" map teaser. Renders Google Maps with one brand-
// styled marker per city where SUNRISE is stocked. No store-level data is
// exposed — users click through to /find for that. Interaction is fully
// locked (no drag, no zoom, no UI controls); this is a visual hook only.
//
// Data source: src/data/retailers.ts → CITY_PINS.

import { useEffect, useRef } from "react";
import { loadGoogleMaps, MAP_STYLE } from "../lib/googleMaps";
import { CITY_PINS } from "../data/retailers";

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

        CITY_PINS.forEach((p) => {
          new maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            icon: pinIcon,
            clickable: false,
            title: `${p.city}, ${p.state}`,
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
