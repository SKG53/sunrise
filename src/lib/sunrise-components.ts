// =============================================================================
// SUNRISE — Canonical Component Render Functions
// Path: src/lib/sunrise-components.ts
//
// Pixel-accurate brand mark output. These functions produce HTML strings that
// match the locked .js canonical specifications exactly. Mount via
// dangerouslySetInnerHTML or ref.current.innerHTML assignment.
//
// Sources:
//   - SUNRISE_Logo_with_TM.js
//   - [5|10|30|60]MG_THC_Potency_Lockup.js
//   - 12_OUNCE_CAN_Lockup.js
// =============================================================================

export type WordmarkMode = "gradient" | "cream" | "dark";

export function renderWordmark(base: number, mode: WordmarkMode = "gradient"): string {
  const tm_size = base * 0.375;
  const spacing = base * 0.125;
  const tm_gap = base * -0.104;
  const tm_shift = base * 0.095;

  let wordStyle: string;
  let tmColor: string;

  if (mode === "gradient") {
    wordStyle =
      "background: linear-gradient(90deg, #4F308D, #822665, #94264B, #BF252D, #CC382C, #DC531F, #E76B37); " +
      "-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;";
    tmColor = "#E76B37";
  } else if (mode === "cream") {
    wordStyle = "color: #FEFBE0;";
    tmColor = "#FEFBE0";
  } else {
    wordStyle = "color: #1A1A1A;";
    tmColor = "#1A1A1A";
  }

  return (
    `<span style="display: inline-block; vertical-align: top; line-height: 0; text-align: left">` +
    `<span style="display: inline; font-family: Montserrat, sans-serif; font-size:${base}px; font-weight: 500; letter-spacing:${spacing}px; text-transform: uppercase; line-height: 1; ${wordStyle}">SUNRISE</span>` +
    `<span style="display: inline-block; font-family: Montserrat, sans-serif; font-size:${tm_size}px; font-weight: 700; color: ${tmColor}; line-height: 1; vertical-align: top; margin-left:${tm_gap}px; margin-top:${tm_shift}px;">™</span>` +
    `</span>`
  );
}

// Unified potency lockup — identical ratios across all tiers
function _renderLockup(dose: string, base: number, color: string): string {
  const mg = base * 0.27;
  const thc = base * 0.66;
  return (
    `<span style="display:inline-block; vertical-align:top; line-height:0; text-align:left">` +
      `<span style="display:inline; font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}; line-height:1">${dose}</span>` +
      `<span style="display:inline-block; vertical-align:top; margin-left:${base * 0.15}px; margin-top:${base * 0.11}px">` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${mg}px; font-weight:900; letter-spacing:${mg * -0.15}px; color:${color}; line-height:1; margin-left:${base * -0.013}px; margin-bottom:${base * -0.075}px">MG</span>` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${thc}px; font-weight:800; letter-spacing:${thc * -0.13}px; color:${color}; line-height:1">THC</span>` +
      `</span>` +
    `</span>`
  );
}

export function render5mgLockup(base: number, color = "#C4922A"): string {
  return _renderLockup("5", base, color);
}
export function render10mgLockup(base: number, color = "#CC1F39"): string {
  return _renderLockup("10", base, color);
}
export function render30mgLockup(base: number, color = "#0B6134"): string {
  return _renderLockup("30", base, color);
}
export function render60mgLockup(base: number, color = "#61213A"): string {
  return _renderLockup("60", base, color);
}

export function render12ozStatBlock(base: number, color = "#C4922A"): string {
  const darkColor = "#1A1A1A";
  const ounceSize = base * 0.27;
  const canSize = base * 0.66;
  return (
    `<span style="display:inline-block; vertical-align:top; line-height:0; text-align:left">` +
      `<span style="display:inline; font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}; line-height:1">12</span>` +
      `<span style="display:inline-block; vertical-align:top; margin-left:${base * 0.15}px; margin-top:${base * 0.11}px">` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${ounceSize}px; font-weight:900; text-transform:uppercase; letter-spacing:${ounceSize * -0.15}px; color:${darkColor}; line-height:1; margin-left:${base * 0.013}px; margin-bottom:${base * -0.075}px">OUNCE</span>` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${canSize}px; font-weight:800; text-transform:uppercase; letter-spacing:${canSize * -0.13}px; color:${darkColor}; line-height:1">CAN</span>` +
      `</span>` +
    `</span>`
  );
}

// Measure the computed px value of --base so brand marks scale with the
// fluid clamp() system defined in sunrise-shell.css
export function getBasePx(): number {
  const probe = document.createElement("div");
  probe.style.width = "var(--base)";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  document.body.removeChild(probe);
  return px || 50;
}
