import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./faq.css";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ · SUNRISE" },
      {
        name: "description",
        content:
          "Frequently asked questions about SUNRISE hemp-derived Delta-9 THC seltzers — potency, effects, ingredients, legality, shipping, and safety.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/faq" },
    ],
  }),
});

// ── DATA ─────────────────────────────────────────────────────────────────
// Section + Q&A content. Tags (1a, 2c, etc.) drive both the in-section
// labels and the sidebar anchor targets. Locked in v6 with founder review.
type FAQItem = { tag: string; q: string; a: React.ReactNode };
type FAQSection = { num: string; id: string; title: string; items: FAQItem[] };

const SECTIONS: FAQSection[] = [
  {
    num: "01",
    id: "hemp-cannabinoids",
    title: "Hemp & Cannabinoids",
    items: [
      {
        tag: "1a",
        q: "What is hemp?",
        a: (
          <p>
            Hemp is a variant of the cannabis plant with 0.3% Delta-9 THC or
            less by dry weight — federally legal under the 2018 Farm Bill. It
            still carries the same psychoactive properties at higher doses, so
            we encourage customers to choose their experience based on comfort
            and habit.
          </p>
        ),
      },
      {
        tag: "1b",
        q: "What is hemp-derived THC?",
        a: (
          <p>
            Delta-9 THC is the cannabinoid responsible for the lift in
            cannabis. The molecule is chemically identical whether it comes
            from hemp or marijuana — what changes is legal status. Hemp-derived
            Delta-9 is federally legal at concentrations of 0.3% or less by
            dry weight.
          </p>
        ),
      },
      {
        tag: "1c",
        q: "What are CBG, CBN, and THCV?",
        a: (
          <p>
            Minor cannabinoids — the supporting cast alongside Delta-9 THC.
            CBG tracks toward focus and uplift, CBN toward relaxation and
            unwinding, THCV toward clarity and engagement. Every variant in
            the lineup blends 30mg of one of these alongside the stated
            Delta-9 dose, shifting the character of the experience without
            changing the THC level.
          </p>
        ),
      },
      {
        tag: "1d",
        q: "How does THC actually work in the body?",
        a: (
          <p>
            THC and other cannabinoids work through the endocannabinoid
            system — a network of receptors in the brain and body that helps
            regulate mood, appetite, pain, and sleep. THC binds to those
            receptors (mainly the ones called CB1 and CB2) to produce the
            lift. Receptor density and tolerance vary by person, which is why
            the same can can feel different from one body to another.
          </p>
        ),
      },
    ],
  },
  {
    num: "02",
    id: "pick-your-potency",
    title: "Pick Your Potency",
    items: [
      {
        tag: "2a",
        q: "How do I pick the right potency?",
        a: (
          <p>
            Depends on you and the moment. 5MG is light and social, 10MG more
            present, 30MG fuller and longer, 60MG a real evening for
            high-tolerance consumers. When in doubt, start lower.
          </p>
        ),
      },
      {
        tag: "2b",
        q: "I've never tried a hemp seltzer. Where should I start?",
        a: (
          <p>
            Start lower than you think and work your way up. Begin with half a
            serving, wait the full window for the lift to arrive, and decide
            from there. A first session is for finding where your line is —
            not testing it.
          </p>
        ),
      },
      {
        tag: "2c",
        q: "Can I mix potencies in one session?",
        a: (
          <p>
            Not advised. Mixing potencies stacks the dose — a 10MG plus a 30MG
            is 40mg of THC, which can land harder than expected. Pick one
            potency and stay with it for the session.
          </p>
        ),
      },
    ],
  },
  {
    num: "03",
    id: "how-it-feels",
    title: "How It Feels",
    items: [
      {
        tag: "3a",
        q: "How will it feel?",
        a: (
          <p>
            Depends on the potency and how your body responds. 5MG is light
            and social, 10MG more present, 30MG fuller and longer, 60MG a real
            evening. When in doubt, start lower within your comfort level,
            wait 40 minutes to an hour for the lift to settle, and consume
            more from there.
          </p>
        ),
      },
      {
        tag: "3b",
        q: "How long until I feel it?",
        a: (
          <p>
            Usually 30 to 40 minutes. Faster than a gummy or chocolate, slower
            than an inhaled product. Wait the full hour before drinking more
            so the onset has time to settle in.
          </p>
        ),
      },
      {
        tag: "3c",
        q: "How long does it last?",
        a: (
          <p>
            A few hours, give or take. Dose, body chemistry, and what you ate
            all shift the curve. The peak tends to be shorter than a typical
            edible, with a smoother fade on the way out.
          </p>
        ),
      },
      {
        tag: "3d",
        q: "Why is this different from a gummy or edible?",
        a: (
          <p>
            Emulsion and absorption. The Delta-9 THC in our seltzers is
            emulsified into microscopic droplets, which lets your body absorb
            it faster and more consistently than a typical gummy. That means
            onset around 30 to 40 minutes instead of 60 to 90, and a cleaner
            taper on the way out.
          </p>
        ),
      },
      {
        tag: "3e",
        q: "What's the difference between alcohol and THC?",
        a: (
          <p>
            Different compounds, different rides. Alcohol is a depressant your
            liver works through over hours, with hangovers and dehydration as
            the cost. THC works through the endocannabinoid system and
            typically produces a shorter peak with a cleaner exit. Our
            seltzers contain no alcohol, and we'd steer clear of mixing the
            two.
          </p>
        ),
      },
      {
        tag: "3f",
        q: "Can I drink on an empty stomach?",
        a: (
          <p>
            You can, though without food the THC tends to absorb faster and
            the lift can arrive in a less predictable way. Eating something
            first lets you pace yourself and helps make for a more comfortable
            experience.
          </p>
        ),
      },
    ],
  },
  {
    num: "04",
    id: "ingredients-quality",
    title: "Ingredients & Quality",
    items: [
      {
        tag: "4a",
        q: "What's in a can?",
        a: (
          <p>
            Our ingredients are designed to be straightforward: purified
            water, pure cane sugar, natural flavoring, emulsified hemp
            extract, B12, citric acid, and sodium benzoate. Lemonade and
            Limeade flavors also contain fresh lemon or lime juice. Full
            ingredient lists are printed on every can.
          </p>
        ),
      },
      {
        tag: "4b",
        q: "Is SUNRISE gluten-free, vegan, and free of major allergens?",
        a: (
          <p>
            Yes — all three. Every can is gluten-free, vegan, and free of the
            eight major allergens (milk, eggs, fish, shellfish, tree nuts,
            peanuts, wheat, and soy).
          </p>
        ),
      },
      {
        tag: "4c",
        q: "How should I store the cans?",
        a: (
          <p>
            Cool, dry, out of direct sunlight. Refrigeration isn't required
            but recommended for the best taste. Every can has a best-by date
            printed on it — drink before that date for freshness and full
            potency.
          </p>
        ),
      },
      {
        tag: "4d",
        q: "Is the product third-party lab tested?",
        a: (
          <p>
            Every batch. Full-panel testing by an accredited third-party lab
            covers cannabinoid potency and contaminants. Scan the QR code on
            any can to visit our website and navigate to the COAs page, where
            you can pull up the Certificate of Analysis for that batch.
          </p>
        ),
      },
    ],
  },
  {
    num: "05",
    id: "health-safety",
    title: "Health & Safety",
    items: [
      {
        tag: "5a",
        q: "Will it show up on a drug test?",
        a: (
          <p>
            Possibly. Standard drug panels test for THC metabolites and don't
            distinguish hemp-derived THC from any other source. If your job or
            situation requires a clean test, we'd caution against our
            products.
          </p>
        ),
      },
      {
        tag: "5b",
        q: "Can I drink while pregnant, breastfeeding, or on medication?",
        a: (
          <p>
            Please do not consume our products if you are pregnant,
            breastfeeding, or taking prescription medications. Always check
            with a healthcare provider before consuming THC products.
          </p>
        ),
      },
      {
        tag: "5c",
        q: "Can I drive after drinking SUNRISE?",
        a: (
          <p>
            Please do not drive or operate heavy machinery after drinking any
            infused beverage. THC impairs reaction time, coordination, and
            judgment, which could create unexpected danger after consumption.
          </p>
        ),
      },
      {
        tag: "5d",
        q: "Does SUNRISE make any health or wellness claims?",
        a: (
          <p>
            None. Our seltzers are a beverage, not a medical product. Nothing
            on this website or on our packaging has been evaluated by the FDA,
            and nothing in the lineup is intended to diagnose, treat, cure, or
            prevent any disease.
          </p>
        ),
      },
    ],
  },
  {
    num: "06",
    id: "legality",
    title: "Legality",
    items: [
      {
        tag: "6a",
        q: "Is SUNRISE legal?",
        a: (
          <p>
            Yes — our beverages are 100% federally legal because every can
            uses hemp-derived Delta-9 THC at or below 0.3% by dry weight,
            which makes them legal under the 2018 Farm Bill. State laws vary,
            however. Please check your local rules for specific guidelines on
            hemp-infused beverage consumption.
          </p>
        ),
      },
      {
        tag: "6b",
        q: "How old do I have to be to order?",
        a: (
          <p>
            21 or older. That applies to browsing, purchasing, and consuming.
            No exceptions.
          </p>
        ),
      },
      {
        tag: "6c",
        q: "Is it legal in my state?",
        a: (
          <p>
            Most US states allow hemp-derived Delta-9 THC beverages — but not
            all. We only ship to states where the product is legal, so if
            checkout completes for your address, you're good.
          </p>
        ),
      },
    ],
  },
  {
    num: "07",
    id: "orders-shipping-returns",
    title: "Orders, Shipping & Returns",
    items: [
      {
        tag: "7a",
        q: "Where can I buy SUNRISE?",
        a: (
          <p>
            Through retail partners in select states across the country, and
            direct from us at savorsunrise.com. We ship across the US in
            compliance with local state regulations for hemp beverages.
          </p>
        ),
      },
      {
        tag: "7b",
        q: "How long does shipping take?",
        a: (
          <p>
            Orders typically process within 1–3 business days and arrive
            within 5–7 business days after that. If you haven't received your
            order 10 business days after placing it, email{" "}
            <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
            and we'll figure it out together.
          </p>
        ),
      },
      {
        tag: "7c",
        q: "Why do you check ID at checkout?",
        a: (
          <p>
            SUNRISE is an adult product — consumers must be 21 or older. ID
            verification at checkout ensures every order goes to a verified
            adult and that we stay compliant with the regulations governing
            hemp-derived THC beverages.
          </p>
        ),
      },
      {
        tag: "7d",
        q: "What's your return policy?",
        a: (
          <p>
            All sales are final — we don't accept returns on beverages once
            sealed cans leave our facility. If your order arrives damaged,
            defective, or incorrect, email{" "}
            <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
            within 48 hours of delivery with your order number, a description,
            and a photo, and we'll work through it with you.
          </p>
        ),
      },
      {
        tag: "7e",
        q: "How do I get in touch?",
        a: (
          <p>
            Email{" "}
            <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
            or visit the <a href="/contact">Contact</a> page for more details.
            Email responses typically arrive within five business days.
          </p>
        ),
      },
    ],
  },
];

// ── COMPONENT ────────────────────────────────────────────────────────────
// Visual treatment mirrors policy pages: tier-30 green pagehero with
// character-stagger animation, cream content section below. Inside content:
// two-column layout — sticky section menu on the left (anchor links jump to
// each section), open content (no collapsible) on the right.
function FAQPage() {
  return (
    <>
      <SiteHeader activeNav="faq" />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="faq-pagehero">
          <h1 className="faq-pagehero-title" aria-label="FAQ">
            {"FAQ".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · BODY ────────────────────────────────────────────────── */}
        <section className="faq-body">
          <div className="container">
            <div className="faq-body-inner">
              {/* Sticky section menu (left column on desktop, top on mobile). */}
              <aside className="faq-menu" aria-label="FAQ sections">
                <div className="faq-menu-label">Sections</div>
                <ul className="faq-menu-list">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`}>
                        <span className="faq-menu-num">{s.num}</span>
                        <span className="faq-menu-text">{s.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Open Q&A content (no collapsible). One block per section. */}
              <div className="faq-content">
                {SECTIONS.map((s) => (
                  <section
                    key={s.id}
                    id={s.id}
                    className="faq-section"
                    aria-labelledby={`${s.id}-title`}
                  >
                    <div className="faq-section-head">
                      <span className="faq-section-num">{s.num}</span>
                      <h2 className="faq-section-title" id={`${s.id}-title`}>
                        {s.title}
                      </h2>
                    </div>

                    <div className="faq-section-items">
                      {s.items.map((it) => (
                        <div key={it.tag} className="faq-item">
                          <h3 className="faq-q">{it.q}</h3>
                          <div className="faq-a">{it.a}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
