import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/sunrise/SiteHeader";
import { SiteFooter } from "@/components/sunrise/SiteFooter";
import { TierCard } from "@/components/sunrise/TierCard";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "SUNRISE — Contact" },
      {
        name: "description",
        content:
          "Questions, wholesale, press — we read every note. Send us a message or reach us directly.",
      },
      { property: "og:title", content: "SUNRISE — Contact" },
      {
        property: "og:description",
        content:
          "Questions, wholesale, press — we read every note. Send us a message or reach us directly.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiry, setInquiry] = useState("general");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="sunrise-page">
      <SiteHeader />

      <main>
        <section className="contact-hero">
          <div className="eyebrow">Contact</div>
          <h1>Get in Touch</h1>
          <div className="rule"></div>
          <p className="hero-subhead">
            Questions, wholesale, press — we read every note. Send us a message or reach us directly.
          </p>
        </section>

        <section className="tiers-section">
          <div className="tiers-section-heading">The Four Tiers</div>
          <div className="tier-cards-grid">
            <TierCard tier={5}  eyebrow="Tier 01" name="A Subtle Lift"        desc="Light · bright · casual" />
            <TierCard tier={10} eyebrow="Tier 02" name="The Perfect Buzz"     desc="Smooth · balanced · social" />
            <TierCard tier={30} eyebrow="Tier 03" name="A Deeper Dive"        desc="Bold · vibrant · spirited" />
            <TierCard tier={60} eyebrow="Tier 04" name="Elevated Experience"  desc="Potent · rich · immersive" />
          </div>
        </section>

        <section className="contact-grid">
          <div>
            <div className="col-heading">Send Us a Note</div>
            <form className="contact-form" onSubmit={handleSubmit}>

              <div className="field-group">
                <label className="field-label" htmlFor="name">Name</label>
                <input
                  className="field-input"
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="email">Email</label>
                <input
                  className="field-input"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field-group">
                <div className="field-label">Inquiry Type</div>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="inq-general"
                      name="inquiry"
                      value="general"
                      checked={inquiry === "general"}
                      onChange={(e) => setInquiry(e.target.value)}
                    />
                    <label htmlFor="inq-general">General</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="inq-wholesale"
                      name="inquiry"
                      value="wholesale"
                      checked={inquiry === "wholesale"}
                      onChange={(e) => setInquiry(e.target.value)}
                    />
                    <label htmlFor="inq-wholesale">Wholesale</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="inq-press"
                      name="inquiry"
                      value="press"
                      checked={inquiry === "press"}
                      onChange={(e) => setInquiry(e.target.value)}
                    />
                    <label htmlFor="inq-press">Press</label>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="message">Message</label>
                <textarea
                  className="field-textarea"
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us what's on your mind"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
              </div>

              <div className="submit-row">
                <button type="submit" className="submit-btn">Send Message</button>
              </div>

            </form>
          </div>

          <div>
            <div className="col-heading">Reach Us Directly</div>
            <div className="contact-details">

              <div className="detail-block">
                <div className="detail-label">Email</div>
                <a href="mailto:Hello@savorsunrise.com" className="detail-value">Hello@savorsunrise.com</a>
              </div>

              <div className="detail-block">
                <div className="detail-label">Phone</div>
                <a href="tel:+18776747459" className="detail-value">(877) 674-7459</a>
              </div>

              <div className="detail-block">
                <div className="detail-label">Mail</div>
                <div className="detail-value address">
                  2032 Utica Square, Unit #52521<br />
                  Tulsa, OK 74114
                </div>
              </div>

              <div className="detail-block social-block">
                <div className="detail-label">Follow</div>
                <div className="social-row">
                  <a href="#">Instagram</a>
                  <a href="#">TikTok</a>
                  <a href="#">LinkedIn</a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}