// Home-page "Where to Find Us" coverage map. Renders all 50 US states as
// static SVG paths, with the states where SUNRISE is currently sold filled
// in tier-30 green. No interactivity, no markers, no map tiles — this is a
// brand-styled coverage indicator, not a locator. The locator UI lives at
// /find.
//
// The component is SSR-rendered: the SVG ships in the server HTML, no
// post-hydration paint, no async loading. State path geometry comes from
// US_STATES_PATHS (Albers USA projection, viewBox 0 0 975 610). Coverage
// state list comes from COVERAGE_STATES in src/data/retailers.ts.
//
// Component name kept as S07Map for compatibility with the existing
// import in src/routes/index.tsx; the internal implementation has been
// replaced wholesale.

import { US_STATES_PATHS } from "../data/us-states-paths";
import { COVERAGE_STATES } from "../data/retailers";

const COVERAGE = new Set(COVERAGE_STATES);

export function S07Map() {
  return (
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
  );
}
