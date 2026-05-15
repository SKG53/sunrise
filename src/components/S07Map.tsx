// Homepage "Find Near You" map teaser. Renders an inline SVG of the US
// with the states where SUNRISE is currently sold filled in tier-30 green;
// every other state renders in a warm gray basemap. No store-level data is
// exposed — users click through to /find for the locator.
//
// The wrapping <div className="s08-map-bg"> preserves the original layout
// contract from the prior Google Maps implementation: existing CSS in
// home.css positions the wrapper absolutely (inset: 0) inside .s08-inner,
// and the floating .s08-card overlays the map via z-index. The SVG fills
// the wrapper responsively while preserving its 975×610 aspect ratio.
//
// Data source: src/data/us-states-paths.ts (50-state geometry, Albers USA
// projection) + src/data/retailers.ts → COVERAGE_STATES (the list of
// states where SUNRISE is currently sold).

import { US_STATES_PATHS } from "../data/us-states-paths";
import { COVERAGE_STATES } from "../data/retailers";

const COVERAGE = new Set(COVERAGE_STATES);

export function S07Map() {
  return (
    <div className="s08-map-bg" aria-hidden="true">
      <svg
        viewBox="0 0 975 610"
        className="s08-coverage-svg"
        role="img"
        aria-label={`US coverage map — SUNRISE is sold in ${COVERAGE_STATES.length} states`}
      >
        {US_STATES_PATHS.map((s) => (
          <path
            key={s.abbrev}
            d={s.d}
            data-abbrev={s.abbrev}
            data-name={s.name}
            className={COVERAGE.has(s.abbrev) ? "is-coverage" : ""}
          />
        ))}
      </svg>
    </div>
  );
}
