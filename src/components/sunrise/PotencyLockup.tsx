type Tier = 5 | 10 | 30 | 60;

const TIER_DEFAULT_COLOR: Record<Tier, string> = {
  5: "#DC7F27",
  10: "#CC1F39",
  30: "#0A6034",
  60: "#2E1E3D",
};

interface PotencyLockupProps {
  tier: Tier;
  size: number;
  color?: string;
}

export function PotencyLockup({ tier, size, color }: PotencyLockupProps) {
  const base = size;
  const dose = String(tier);
  const c = color || TIER_DEFAULT_COLOR[tier];
  const mg = base * 0.27;
  const thc = base * 0.66;

  return (
    <span
      style={{
        display: "inline-block",
        verticalAlign: "top",
        lineHeight: 0,
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "inline",
          fontFamily: "Montserrat, sans-serif",
          fontSize: `${base}px`,
          fontWeight: 900,
          letterSpacing: `${base * -0.105}px`,
          color: c,
          lineHeight: 1,
        }}
      >
        {dose}
      </span>
      <span
        style={{
          display: "inline-block",
          verticalAlign: "top",
          marginLeft: `${base * 0.15}px`,
          marginTop: `${base * 0.11}px`,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "Montserrat, sans-serif",
            fontSize: `${mg}px`,
            fontWeight: 900,
            letterSpacing: `${mg * -0.15}px`,
            color: c,
            lineHeight: 1,
            marginLeft: `${base * -0.013}px`,
            marginBottom: `${base * -0.075}px`,
          }}
        >
          MG
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "Montserrat, sans-serif",
            fontSize: `${thc}px`,
            fontWeight: 800,
            letterSpacing: `${thc * -0.13}px`,
            color: c,
            lineHeight: 1,
          }}
        >
          THC
        </span>
      </span>
    </span>
  );
}