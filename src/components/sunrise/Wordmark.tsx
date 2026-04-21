type WordmarkMode = "gradient" | "cream";

interface WordmarkProps {
  size: number;
  mode?: WordmarkMode;
}

export function Wordmark({ size, mode = "gradient" }: WordmarkProps) {
  const base = size;
  const tm_size = base * 0.375;
  const spacing = base * 0.125;
  const tm_gap = base * -0.104;
  const tm_shift = base * 0.095;

  const isCream = mode === "cream";
  const tmColor = isCream ? "#FEFBE0" : "#E76B37";

  const wordmarkStyle: React.CSSProperties = isCream
    ? {
        display: "inline",
        fontFamily: "Montserrat, sans-serif",
        fontSize: `${base}px`,
        fontWeight: 500,
        letterSpacing: `${spacing}px`,
        textTransform: "uppercase",
        lineHeight: 1,
        color: "#FEFBE0",
      }
    : {
        display: "inline",
        fontFamily: "Montserrat, sans-serif",
        fontSize: `${base}px`,
        fontWeight: 500,
        letterSpacing: `${spacing}px`,
        textTransform: "uppercase",
        lineHeight: 1,
        background:
          "linear-gradient(90deg, #4F308D, #822665, #94264B, #BF252D, #CC382C, #DC531F, #E76B37)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      };

  return (
    <span
      style={{
        display: "inline-block",
        verticalAlign: "top",
        lineHeight: 0,
        textAlign: "left",
      }}
    >
      <span style={wordmarkStyle}>SUNRISE</span>
      <span
        style={{
          display: "inline-block",
          fontFamily: "Montserrat, sans-serif",
          fontSize: `${tm_size}px`,
          fontWeight: 700,
          color: tmColor,
          lineHeight: 1,
          verticalAlign: "top",
          marginLeft: `${tm_gap}px`,
          marginTop: `${tm_shift}px`,
        }}
      >
        ™
      </span>
    </span>
  );
}