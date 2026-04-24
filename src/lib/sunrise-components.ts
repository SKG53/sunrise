// Canonical brand mark render functions. Produce HTML strings matching the
// locked .js specs exactly. Mount via ref.current.innerHTML assignment.
//
// Sources:
//   - SUNRISE_Logo_with_TM.js
//   - [5|10|30|60]MG_THC_Potency_Lockup.js
//   - 12_OUNCE_CAN_Lockup.js

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

// ═══════════════════════════════════════════════════════════════════════════
// CANNABINOID LOCKUPS — three families × three cannabinoids
//
// Sources (locked .js specs):
//   - [CBG|CBN|THCV]_Text_Lockup.js          → just the cannabinoid word
//   - +[CBG|CBN|THCV]_Lockup.js              → plus sign + word
//   - 30MG_[CBG|CBN|THCV]_Potency_Lockup.js  → +30 | MG / CBX stacked
//
// Default colors:
//   CBG  #DC7F27 (orange)
//   CBN  #2E1E3D (dark purple)
//   THCV #CC1F39 (red)
// ═══════════════════════════════════════════════════════════════════════════

// ── Text-only (cannabinoid word, no plus) ──────────────────────────────────
function _renderCannabinoidTextLockup(word: string, base: number, color: string): string {
  return (
    `<span style="display:inline-block; text-align:left; line-height:1">` +
      `<span style="font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}">${word}</span>` +
    `</span>`
  );
}

export function renderCBGTextLockup(base: number, color = "#DC7F27"): string {
  return _renderCannabinoidTextLockup("CBG", base, color);
}
export function renderCBNTextLockup(base: number, color = "#2E1E3D"): string {
  return _renderCannabinoidTextLockup("CBN", base, color);
}
export function renderTHCVTextLockup(base: number, color = "#CC1F39"): string {
  return _renderCannabinoidTextLockup("THCV", base, color);
}

// ── Plus + cannabinoid word ────────────────────────────────────────────────
function _renderPlusCannabinoidLockup(word: string, base: number, color: string): string {
  return (
    `<span style="display:inline-block; text-align:left; line-height:1">` +
      `<span style="font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:0px; color:${color}; margin-left:${base * 0.01}px">+</span>` +
      `<span style="font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}; margin-left:${base * -0.02}px">${word}</span>` +
    `</span>`
  );
}

export function renderCBGLockup(base: number, color = "#DC7F27"): string {
  return _renderPlusCannabinoidLockup("CBG", base, color);
}
export function renderCBNLockup(base: number, color = "#2E1E3D"): string {
  return _renderPlusCannabinoidLockup("CBN", base, color);
}
export function renderTHCVLockup(base: number, color = "#CC1F39"): string {
  return _renderPlusCannabinoidLockup("THCV", base, color);
}

// ── +30mg [cannabinoid] potency lockup (stacked MG / CBX) ──────────────────
// CBN and CBG share an mg-margin-left of +0.022; THCV is the outlier at -0.013
// per the locked specs (mirrors the THC potency lockup's negative inset).
function _render30mgCannabinoidLockup(
  word:string,
  base:number,
  color:string,
  mgMarginLeftFactor:number
): string {
  const mg = base * 0.27;
  const word_size = base * 0.66;
  return (
    `<span style="display:inline-block; vertical-align:top; line-height:0; text-align:left">` +
      `<span style="display:inline; font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:0px; color:${color}; line-height:1; margin-left:${base * 0.015}px">+</span>` +
      `<span style="display:inline; font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}; line-height:1; margin-left:${base * -0.025}px">30</span>` +
      `<span style="display:inline-block; vertical-align:top; margin-left:${base * 0.15}px; margin-top:${base * 0.11}px">` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${mg}px; font-weight:900; letter-spacing:${mg * -0.15}px; color:${color}; line-height:1; margin-left:${base * mgMarginLeftFactor}px; margin-bottom:${base * -0.075}px">MG</span>` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${word_size}px; font-weight:800; letter-spacing:${word_size * -0.13}px; color:${color}; line-height:1">${word}</span>` +
      `</span>` +
    `</span>`
  );
}

export function render30mgCBGLockup(base: number, color = "#DC7F27"): string {
  return _render30mgCannabinoidLockup("CBG", base, color, 0.022);
}
export function render30mgCBNLockup(base: number, color = "#2E1E3D"): string {
  return _render30mgCannabinoidLockup("CBN", base, color, 0.022);
}
export function render30mgTHCVLockup(base: number, color = "#CC1F39"): string {
  return _render30mgCannabinoidLockup("THCV", base, color, -0.013);
}
