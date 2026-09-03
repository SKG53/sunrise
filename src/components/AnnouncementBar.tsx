// Site-wide rotating announcement bar. Mounted in __root.tsx so it renders
// above the sticky header on every route — product pages, policy pages, 404.
//
// Two slides cross every 2.5s with a left→right slide: the outgoing banner
// exits to the right while the incoming enters from the left. Slide 1 is the
// evergreen free-shipping line on the gold field; slide 2 is the Labor Day
// sale on a deep-purple field with gold emphasis, and it pops a scatter of
// mini fireworks (the Spin & Save particle style) each time it lands.
//
// Each slide links to /products. Reduced-motion: rotation still runs so both
// messages are seen, but the slide becomes a plain fade and fireworks are
// suppressed. Styling lives in sunrise-shell.css under ANNOUNCEMENT BAR.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Banner = { sale: boolean; node: ReactNode };

const BANNERS: Banner[] = [
  {
    sale: false,
    node: (
      <>
        Free shipping on all orders{" "}
        <span className="announcement-bar-emph">$75+</span>
      </>
    ),
  },
  {
    sale: true,
    node: (
      <>
        Labor Day Sale - Save{" "}
        <span className="announcement-bar-emph">15% Sitewide</span>
      </>
    ),
  },
];

// Scatter points + colors for the mini fireworks. Colors cycle the tier
// palette + gold/cream so the bursts read against the deep-purple field.
const FW_SPOTS = [
  { left: "8%", top: "46%" },
  { left: "27%", top: "26%" },
  { left: "46%", top: "60%" },
  { left: "62%", top: "30%" },
  { left: "80%", top: "54%" },
  { left: "92%", top: "34%" },
];
const FW_COLORS = [
  "var(--tier-5)",
  "var(--tier-10)",
  "var(--tier-30)",
  "var(--gold)",
  "var(--cream)",
];

function Fireworks() {
  return (
    <div className="announcement-bar-fw" aria-hidden="true">
      {FW_SPOTS.map((s, i) => (
        <span
          key={i}
          className="ann-burst"
          style={{
            left: s.left,
            top: s.top,
            color: FW_COLORS[i % FW_COLORS.length],
            animationDelay: `${i * 0.09}s`,
          }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <span
              key={j}
              className="ann-particle"
              style={
                {
                  "--rotate": `${j * 30}deg`,
                  animationDelay: `${i * 0.09}s`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.("change", onChange);

    const id = setInterval(() => {
      setIdx((cur) => {
        const next = (cur + 1) % BANNERS.length;
        setPrev(cur);
        if (BANNERS[next].sale && !mq.matches) setBurst((b) => b + 1);
        return next;
      });
    }, 2500);

    return () => {
      clearInterval(id);
      mq.removeEventListener?.("change", onChange);
    };
  }, []);

  // Drop the leaving slide once its transition finishes.
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 480);
    return () => clearTimeout(t);
  }, [prev, idx]);

  return (
    <div
      className={"announcement-bar" + (BANNERS[idx].sale ? " is-sale" : "")}
      role="region"
      aria-label="Announcements"
    >
      {BANNERS[idx].sale && !reduce && <Fireworks key={burst} />}
      <div className="announcement-bar-track">
        {BANNERS.map((b, i) => (
          <a
            key={i}
            href="/products"
            className={
              "announcement-bar-slide" +
              (i === idx ? " is-active" : "") +
              (i === prev ? " is-leaving" : "")
            }
            aria-hidden={i === idx ? undefined : true}
            tabIndex={i === idx ? undefined : -1}
          >
            {b.node}
          </a>
        ))}
      </div>
    </div>
  );
}
