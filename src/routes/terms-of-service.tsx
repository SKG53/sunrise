import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./terms-of-service.css";

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfServicePage,
  head: () => ({
    meta: [
      { title: "Terms of Service · SUNRISE" },
      {
        name: "description",
        content:
          "Terms governing your use of the SUNRISE Beverage store and website. Includes hemp-derived product acknowledgment, age requirements, ordering, shipping, intellectual property, binding arbitration, and class action waiver.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/terms-of-service" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// Structural mirror of /privacy-policy, /refund-policy, /shipping-policy.
// v2 (this revision): comprehensive rewrite. Adds:
//   · "Important Notice — Please Read Carefully" callout block (allcaps,
//     tier-30 left border) flagging arbitration / class waiver / jury waiver
//   · Section 1 Hemp-Derived Product Acknowledgment (was previously absent)
//   · Section 7 Age Verification (cross-references new Age Verification Policy)
//   · Section 18 Limitation of Liability — adds aggregate-cap clause
//   · Section 20 Informal Dispute Resolution
//   · Section 21 Binding Individual Arbitration (with 30-day opt-out)
//   · Section 22 Class Action Waiver
//   · Section 23 Waiver of Jury Trial
//   · Section 24 Statute of Limitations
//   · Section 25 DMCA / Copyright Takedown
//   · Section 29 Governing Law revised — Oklahoma specifically
function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="tos-pagehero">
          <h1 className="tos-pagehero-title" aria-label="Terms">
            {"Terms".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="tos-policy">
          <div className="container">
            <div className="tos-policy-inner">
              <h2 className="tos-policy-title">Terms of Service</h2>

              <p className="tos-policy-effective">
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="tos-policy-body">
                <h3 className="tos-policy-heading">Overview</h3>
                <p>
                  Welcome to SUNRISE Beverage. The terms "we," "us," and "our"
                  refer to SUNRISE Beverage. SUNRISE Beverage operates this
                  store and website, including all related information,
                  content, features, tools, products, and services in order to
                  provide you, the customer, with a curated shopping
                  experience (the "Services"). SUNRISE Beverage is powered by
                  Shopify, which enables us to provide the Services to you.
                </p>
                <p>
                  The terms and conditions below, together with any policies
                  referenced herein (these "Terms of Service" or "Terms"),
                  describe your rights and responsibilities when you use the
                  Services.
                </p>
                <p>
                  By visiting, interacting with, or using our Services, you
                  agree to be bound by these Terms of Service and our{" "}
                  <a href="/privacy-policy">Privacy Policy</a>. If you do not
                  agree to these Terms of Service or Privacy Policy, you
                  should not use or access our Services.
                </p>

                {/* Important Notice callout — surfaces arbitration / class
                    waiver / jury waiver up top. Visually distinct from body
                    headings via .tos-policy-callout (tier-30 left border,
                    allcaps copy in legal-conspicuous typography).            */}
                <div className="tos-policy-callout">
                  <div className="tos-policy-callout-label">
                    Important Notice — Please Read Carefully
                  </div>
                  <p className="tos-policy-allcaps">
                    THESE TERMS CONTAIN A BINDING ARBITRATION AGREEMENT, A
                    CLASS ACTION WAIVER, AND A JURY TRIAL WAIVER. BY USING OUR
                    SERVICES OR PURCHASING OUR PRODUCTS, YOU AGREE THAT
                    DISPUTES BETWEEN YOU AND SUNRISE BEVERAGE WILL BE RESOLVED
                    BY BINDING INDIVIDUAL ARBITRATION, AND YOU WAIVE YOUR
                    RIGHT TO PARTICIPATE IN A CLASS ACTION OR HAVE YOUR CLAIMS
                    HEARD BY A JURY. PLEASE REVIEW SECTIONS 21 THROUGH 25
                    CAREFULLY.
                  </p>
                </div>

                <h3 className="tos-policy-heading">1. Hemp-Derived Product Acknowledgment</h3>
                <p>
                  The products displayed and available for sale on this
                  website (1) are hemp-derived cannabinoid products that
                  comply with the federal legal limit of less than 0.3%
                  Delta-9 tetrahydrocannabinol (THC) by dry weight, in
                  accordance with the Agriculture Improvement Act of 2018
                  ("2018 Farm Bill"); (2) do not claim to diagnose, treat,
                  mitigate, cure, or prevent any disease; and (3) have not
                  been evaluated or approved by the United States Food and
                  Drug Administration (FDA) for safety, efficacy,
                  effectiveness, or quality.
                </p>
                <p>You expressly acknowledge that:</p>
                <ul className="tos-policy-list">
                  <li>
                    You are familiar with and assume full responsibility for
                    complying with all federal, state, and local laws regarding
                    the purchase, possession, and consumption of hemp-derived
                    cannabinoid products in your jurisdiction.
                  </li>
                  <li>
                    Hemp-derived Delta-9 THC is an intoxicating substance.
                    Effects vary by individual, dosage, and a number of
                    personal factors. Onset may be delayed for thirty (30)
                    minutes or longer, and effects may last several hours.
                  </li>
                  <li>
                    You will not operate a vehicle, heavy machinery, or any
                    equipment requiring full attention while consuming or
                    under the influence of our products.
                  </li>
                  <li>
                    Our products may cause a positive result on a drug test.
                    SUNRISE Beverage is not responsible for any consequence
                    resulting from a drug test.
                  </li>
                  <li>
                    You will not consume our products if you are pregnant,
                    nursing, taking prescription medications, or have a
                    medical condition, without first consulting a qualified
                    medical professional.
                  </li>
                  <li>
                    You will keep our products out of reach of children and
                    animals.
                  </li>
                  <li>
                    You are solely responsible for ensuring that the shipping
                    address you provide is in a jurisdiction where receipt of
                    our products is lawful.
                  </li>
                </ul>

                <h3 className="tos-policy-heading">2. Access and Account</h3>
                <p>
                  By agreeing to these Terms of Service, you represent that
                  you are at least 21 years of age. The Services, including
                  this website and any products offered through it, are
                  intended exclusively for individuals 21 and older. We use
                  age-verification tools at the point of entry, at checkout,
                  and at delivery, as described in our{" "}
                  <a href="/age-verification-policy">Age Verification Policy</a>.
                </p>
                <p>
                  To use the Services, you may be asked to provide certain
                  information, such as your email address, date of birth,
                  billing, payment, and shipping information. You represent
                  and warrant that all the information you provide in our
                  stores is correct, current, and complete and that you have
                  all rights necessary to provide this information.
                </p>
                <p>
                  You are solely responsible for maintaining the security of
                  your account credentials and for all of your account
                  activity. You may not transfer, sell, assign, or license
                  your account to any other person.
                </p>

                <h3 className="tos-policy-heading">3. Our Products</h3>
                <p>
                  We have made every effort to provide an accurate
                  representation of our products and services in our online
                  stores. However, please note that colors or product
                  appearance may differ from how they may appear on your
                  screen due to the type of device you use to access the store
                  and your device settings and configuration.
                </p>
                <p>
                  We do not warrant that the appearance or quality of any
                  products or services purchased by you will meet your
                  expectations or be the same as depicted or rendered in our
                  online stores.
                </p>
                <p>
                  All descriptions of products are subject to change at any
                  time without notice at our sole discretion. We reserve the
                  right to discontinue any product at any time and may limit
                  the quantities of any products that we offer to any person,
                  geographic region, or jurisdiction, on a case-by-case basis.
                  We reserve the right, in our sole discretion, to refuse or
                  cancel any order at any time, including for reasons of
                  suspected fraud, suspected age-verification failure,
                  suspected unauthorized resale, or any change in applicable
                  law.
                </p>

                <h3 className="tos-policy-heading">4. Orders</h3>
                <p>
                  When you place an order, you are making an offer to
                  purchase. SUNRISE Beverage reserves the right to accept or
                  decline your order for any reason at its sole discretion.
                  Your order is not accepted until SUNRISE Beverage confirms
                  acceptance. We must receive and process your payment before
                  your order is accepted. Please review your order carefully
                  before submitting, as SUNRISE Beverage may be unable to
                  accommodate cancellation requests after an order is
                  accepted. In the event that we do not accept, make a change
                  to, or cancel an order, we will attempt to notify you by
                  contacting the email, billing address, and/or phone number
                  provided at the time the order was made.
                </p>
                <p>
                  Your purchases are subject to return or exchange solely in
                  accordance with our{" "}
                  <a href="/refund-policy">Refund Policy</a>.
                </p>
                <p>
                  You represent and warrant that your purchases are for your
                  own personal or household use and not for commercial resale
                  or export.
                </p>

                <h3 className="tos-policy-heading">5. Prices and Billing</h3>
                <p>
                  Prices, discounts, and promotions are subject to change
                  without notice. The price charged for a product or service
                  will be the price in effect at the time the order is placed
                  and will be set out in your order confirmation email. Unless
                  otherwise expressly stated, posted prices do not include
                  taxes, shipping, handling, customs, or import charges.
                </p>
                <p>
                  Prices posted in our online stores may be different from
                  prices offered in physical stores or in online or other
                  stores operated by third parties. We may offer, from time to
                  time, promotions on the Services that may affect pricing
                  and that are governed by terms and conditions separate from
                  these Terms. If there is a conflict between the terms for a
                  promotion and these Terms, the promotion terms will govern.
                </p>
                <p>
                  You agree to provide current, complete, and accurate
                  purchase, payment, and account information for all
                  purchases made at our stores. You agree to promptly update
                  your account and other information so that we can complete
                  your transactions and contact you as needed.
                </p>
                <p>
                  You represent and warrant that (i) the credit card
                  information you provide is true, correct, and complete;
                  (ii) you are duly authorized to use such credit card for the
                  purchase; (iii) charges incurred by you will be honored by
                  your credit card company; and (iv) you will pay charges
                  incurred by you at the posted prices, including shipping
                  and handling charges and all applicable taxes.
                </p>

                <h3 className="tos-policy-heading">6. Shipping and Delivery</h3>
                <p>
                  Shipping methods, delivery timelines, carrier handling,
                  adult-signature requirements, and related terms are governed
                  by our <a href="/shipping-policy">Shipping Policy</a>. Please
                  refer to our Shipping Policy for full details.
                </p>
                <p>
                  Once we transfer your order to the carrier, title and risk
                  of loss pass to you. We are not liable for delays caused by
                  shipping carriers, customs processing, or other events
                  outside our control.
                </p>

                <h3 className="tos-policy-heading">7. Age Verification</h3>
                <p>
                  You acknowledge that we use third-party age-verification
                  services and that you may be required to provide identifying
                  information, including a photograph of a government-issued
                  ID, to confirm your age before your order is processed. You
                  also acknowledge that, depending on your shipping
                  destination, your delivery may require an adult signature
                  from a person 21 or older. If your order cannot be verified
                  or delivered for these reasons, we may cancel your order,
                  and you will not be entitled to compensation beyond a refund
                  of the purchase price (less any non-refundable shipping
                  fees).
                </p>

                <h3 className="tos-policy-heading">8. Intellectual Property</h3>
                <p>
                  Our Services, including but not limited to all trademarks,
                  brands, text, displays, images, graphics, product reviews,
                  video, and audio, and the design, selection, and
                  arrangement thereof, are owned by SUNRISE Beverage, its
                  affiliates, or licensors and are protected by U.S. and
                  foreign patent, copyright, and other intellectual property
                  laws.
                </p>
                <p>
                  These Terms permit you to use the Services for your
                  personal, non-commercial use only. You must not reproduce,
                  distribute, modify, create derivative works of, publicly
                  display, publicly perform, republish, download, store, or
                  transmit any of the material on the Services without our
                  prior written consent. Except as expressly provided herein,
                  nothing in these Terms grants or shall be construed as
                  granting a license or other rights to you under any patent,
                  trademark, copyright, or other intellectual property of
                  SUNRISE Beverage, Shopify, or any third party. Unauthorized
                  use of the Services may be a violation of federal and state
                  intellectual property laws. All rights not expressly
                  granted herein are reserved by SUNRISE Beverage.
                </p>
                <p>
                  SUNRISE Beverage's names, logos, product and service names,
                  designs, and slogans are trademarks of SUNRISE Beverage or
                  its affiliates or licensors. You must not use such
                  trademarks without the prior written permission of SUNRISE
                  Beverage. Shopify's name, logo, product and service names,
                  designs, and slogans are trademarks of Shopify. All other
                  names, logos, product and service names, designs, and
                  slogans on the Services are the trademarks of their
                  respective owners.
                </p>

                <h3 className="tos-policy-heading">9. Optional Tools and Third-Party Links</h3>
                <p>
                  You may be provided with access to customer tools offered
                  by third parties as part of the Services, which we neither
                  monitor nor have any control nor input over. You acknowledge
                  and agree that we provide access to such tools "as is" and
                  "as available" without any warranties, representations, or
                  conditions of any kind and without any endorsement.
                </p>
                <p>
                  The Services may contain materials and hyperlinks to
                  websites provided or operated by third parties (including
                  any embedded third-party functionality). We are not
                  responsible for examining or evaluating the content or
                  accuracy of any third-party materials or websites you
                  choose to access. If you decide to leave the Services to
                  access these materials or third-party sites, you do so at
                  your own risk. Complaints, claims, concerns, or questions
                  regarding third-party products and services should be
                  directed to the third-party.
                </p>

                <h3 className="tos-policy-heading">10. Relationship with Shopify</h3>
                <p>
                  SUNRISE Beverage is powered by Shopify, which enables us to
                  provide the Services to you. However, any sales and
                  purchases you make in our store are made directly with
                  SUNRISE Beverage. By using the Services, you acknowledge
                  and agree that Shopify is not responsible for any aspect of
                  any sales between you and SUNRISE Beverage, including any
                  injury, damage, or loss resulting from purchased products
                  and services. You hereby expressly release Shopify and its
                  affiliates from all claims, damages, and liabilities
                  arising from or related to your purchases and transactions
                  with SUNRISE Beverage.
                </p>

                <h3 className="tos-policy-heading">11. Privacy</h3>
                <p>
                  All personal information we collect through the Services is
                  subject to our{" "}
                  <a href="/privacy-policy">Privacy Policy</a>, and certain
                  personal information may be subject to Shopify's Privacy
                  Policy, which can be viewed at{" "}
                  <a
                    href="https://privacy.shopify.com/en"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    privacy.shopify.com
                  </a>
                  . By using the Services, you acknowledge that you have read
                  these privacy policies.
                </p>

                <h3 className="tos-policy-heading">12. Feedback</h3>
                <p>
                  If you submit, upload, post, email, or otherwise transmit
                  any ideas, suggestions, feedback, reviews, proposals,
                  plans, or other content (collectively, "Feedback"), you
                  grant us a perpetual, worldwide, sublicensable,
                  royalty-free license to use, reproduce, modify, publish,
                  distribute, and display such Feedback in any medium for any
                  purpose, including for commercial use.
                </p>
                <p>
                  You also represent and warrant that: (i) you own or have
                  all necessary rights to all Feedback; (ii) you have
                  disclosed any compensation or incentives received in
                  connection with your submission of Feedback; and (iii) your
                  Feedback will comply with these Terms. We are and shall be
                  under no obligation (1) to maintain your Feedback in
                  confidence; (2) to pay compensation for your Feedback; or
                  (3) to respond to your Feedback.
                </p>
                <p>
                  We may, but have no obligation to, monitor, edit, or remove
                  Feedback that we determine in our sole discretion to be
                  unlawful, offensive, threatening, libelous, defamatory,
                  pornographic, obscene, or otherwise objectionable, or that
                  violates any party's intellectual property or these Terms
                  of Service.
                </p>

                <h3 className="tos-policy-heading">13. Errors, Inaccuracies, and Omissions</h3>
                <p>
                  Occasionally there may be information on or in the Services
                  that contains typographical errors, inaccuracies, or
                  omissions that may relate to product descriptions, pricing,
                  promotions, offers, product shipping charges, transit
                  times, and availability. We reserve the right to correct
                  any errors, inaccuracies, or omissions, and to change or
                  update information or cancel orders if any information is
                  inaccurate at any time without prior notice (including
                  after you have submitted your order).
                </p>

                <h3 className="tos-policy-heading">14. Prohibited Uses</h3>
                <p>
                  You may access and use the Services for lawful purposes
                  only. You may not access or use the Services, directly or
                  indirectly: (a) for any unlawful or malicious purpose; (b)
                  to violate any international, federal, provincial, state,
                  or local regulations, rules, laws, or ordinances, including
                  any applicable hemp, controlled-substance, or alcohol
                  regulations; (c) to infringe upon or violate our
                  intellectual property rights or the intellectual property
                  rights of others; (d) to harass, abuse, insult, harm,
                  defame, slander, disparage, intimidate, or harm any of our
                  employees or any other person; (e) to transmit false or
                  misleading information; (f) to send, knowingly receive,
                  upload, download, use, or re-use any material that does not
                  comply with these Terms; (g) to transmit, or procure the
                  sending of, any advertising or promotional material,
                  including any "junk mail," "chain letter," "spam," or any
                  other similar solicitation; (h) to impersonate or attempt
                  to impersonate any other person or entity; (i) to purchase
                  products on behalf of, or for resale to, any individual
                  under 21 years of age; or (j) to engage in any other
                  conduct that restricts or inhibits anyone's use or
                  enjoyment of the Services, or which, as determined by us,
                  may harm SUNRISE Beverage, Shopify, or users of the
                  Services, or expose them to liability.
                </p>
                <p>
                  In addition, you agree not to: (a) upload or transmit
                  viruses or any other type of malicious code that will or
                  may be used in any way that will affect the functionality
                  or operation of the Services; (b) reproduce, duplicate,
                  copy, extract, sell, resell, or exploit any portion of the
                  Services; (c) collect or track the personal information of
                  others; (d) spam, phish, pharm, or pretext the Services;
                  (e) use any robot, spider, scraping, data gathering and
                  extraction tools, automatic devices, or processes to access
                  the Services other than as expressly permitted under
                  Section 15 (Agents); or (f) interfere with, bypass, or
                  circumvent the security or authorization features, robot
                  exclusion headers, or other measures we employ to restrict
                  access to the Services. We reserve the right to suspend,
                  disable, or terminate your account at any time, without
                  notice, if we determine that you have violated any part of
                  these Terms.
                </p>

                <h3 className="tos-policy-heading">15. Agents</h3>
                <p>
                  <strong>15.1</strong> This section ("Agent Terms") applies
                  if you use, allow, enable, or cause the deployment of an
                  Agent to access, use, or interact with any Services.
                  "Agent" means any software or service that takes autonomous
                  or semi-autonomous action on behalf of, or at the
                  instruction of, any person or entity and that can be
                  executed on behalf of or using a person's device, without
                  direct supervision.
                </p>
                <p>
                  <strong>15.2</strong> No Agent may access, use, or interact
                  with Services unless, at all times, it identifies itself
                  and operates in strict accordance with the requirements in
                  Section 15.4 below. In addition, no Agent may access, use,
                  or interact with Services if we have requested that the
                  Agent refrain from accessing, using, or interacting with
                  any service.
                </p>
                <p>
                  <strong>15.3</strong> We may limit, including by technical
                  measures, whether and how any Agent accesses, uses, and
                  interacts with Services.
                </p>
                <p>
                  <strong>15.4</strong> Agents must: (i) in all HTTP/HTTPS
                  requests, identify that the request is from an Agent and
                  disclose the name of the Agent by including the following
                  in the request's user agent string: "Agent/[agent name]";
                  (ii) not conceal or obfuscate that any access, use, or
                  interactions are from an Agent, such as by (a) mimicking
                  human behavior and interaction patterns, or (b) completing
                  or circumventing CAPTCHAs or measures intended to
                  distinguish computer use from humans; (iii) respond
                  truthfully to any question or prompt seeking to determine
                  if interactions are coming from a human or a computer; (iv)
                  not circumvent or otherwise avoid any measure intended to
                  block, limit, modify, or control whether and how Agents
                  access, use, or interact with the Services.
                </p>

                <h3 className="tos-policy-heading">16. Termination</h3>
                <p>
                  We may terminate this agreement or your access to the
                  Services (or any part thereof) in our sole discretion at
                  any time without notice, and you will remain liable for all
                  amounts due up to and including the date of termination.
                </p>
                <p>
                  The following sections will continue to apply following any
                  termination: Hemp-Derived Product Acknowledgment,
                  Intellectual Property, Feedback, Termination, Disclaimer of
                  Warranties, Limitation of Liability, Indemnification,
                  Informal Dispute Resolution, Binding Individual Arbitration,
                  Class Action Waiver, Waiver of Jury Trial, Statute of
                  Limitations, DMCA, Severability, Waiver; Entire Agreement,
                  Assignment, Governing Law, Privacy Policy, and any other
                  provisions that by their nature should survive termination.
                </p>

                <h3 className="tos-policy-heading">17. Disclaimer of Warranties</h3>
                <p>
                  The information presented on or through the Services is
                  made available solely for general information purposes. We
                  do not warrant the accuracy, completeness, or usefulness
                  of this information. Any reliance you place on such
                  information is strictly at your own risk. We disclaim all
                  liability and responsibility arising from any reliance
                  placed on such materials by you or any other visitor to
                  the Services, or by anyone who may be informed of any of
                  its contents.
                </p>
                <p className="tos-policy-allcaps">
                  EXCEPT AS EXPRESSLY STATED BY SUNRISE BEVERAGE, THE
                  SERVICES AND ALL PRODUCTS OFFERED THROUGH THE SERVICES ARE
                  PROVIDED "AS IS" AND "AS AVAILABLE" FOR YOUR USE, WITHOUT
                  ANY REPRESENTATION, WARRANTIES OR CONDITIONS OF ANY KIND,
                  EITHER EXPRESS OR IMPLIED, INCLUDING ALL IMPLIED WARRANTIES
                  OR CONDITIONS OF MERCHANTABILITY, MERCHANTABLE QUALITY,
                  FITNESS FOR A PARTICULAR PURPOSE, DURABILITY, TITLE, AND
                  NON-INFRINGEMENT. WE DO NOT GUARANTEE, REPRESENT OR WARRANT
                  THAT YOUR USE OF THE SERVICES WILL BE UNINTERRUPTED,
                  TIMELY, SECURE OR ERROR-FREE. SOME JURISDICTIONS LIMIT OR
                  DO NOT ALLOW THE DISCLAIMER OF IMPLIED OR OTHER WARRANTIES
                  SO THE ABOVE DISCLAIMER MAY NOT APPLY TO YOU.
                </p>

                <h3 className="tos-policy-heading">18. Limitation of Liability</h3>
                <p className="tos-policy-allcaps">
                  TO THE FULLEST EXTENT PROVIDED BY LAW, IN NO CASE SHALL
                  SUNRISE BEVERAGE, OUR PARTNERS, DIRECTORS, OFFICERS,
                  EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, SERVICE
                  PROVIDERS OR LICENSORS, OR THOSE OF SHOPIFY AND ITS
                  AFFILIATES, BE LIABLE FOR ANY INJURY, LOSS, CLAIM, OR ANY
                  DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL, OR
                  CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING, WITHOUT
                  LIMITATION, LOST PROFITS, LOST REVENUE, LOST SAVINGS, LOSS
                  OF DATA, REPLACEMENT COSTS, OR ANY SIMILAR DAMAGES, WHETHER
                  BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT
                  LIABILITY OR OTHERWISE, ARISING FROM YOUR USE OF ANY OF THE
                  SERVICES OR ANY PRODUCTS PROCURED USING THE SERVICES, OR
                  FOR ANY OTHER CLAIM RELATED IN ANY WAY TO YOUR USE OF THE
                  SERVICES OR ANY PRODUCT.
                </p>
                <p className="tos-policy-allcaps">
                  NOTWITHSTANDING THE FOREGOING, IF SUNRISE BEVERAGE IS FOUND
                  LIABLE TO YOU FOR ANY DAMAGES OR LOSSES, IN NO EVENT SHALL
                  SUNRISE BEVERAGE'S TOTAL AGGREGATE LIABILITY EXCEED THE
                  GREATER OF (A) THE TOTAL AMOUNT PAID BY YOU TO SUNRISE
                  BEVERAGE IN THE TWELVE (12) MONTHS PRECEDING THE EVENT
                  GIVING RISE TO THE LIABILITY, OR (B) ONE HUNDRED U.S.
                  DOLLARS ($100.00).
                </p>
                <p className="tos-policy-allcaps">
                  SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION
                  OF CERTAIN DAMAGES, SO SOME OR ALL OF THE ABOVE LIMITATIONS
                  MAY NOT APPLY TO YOU.
                </p>

                <h3 className="tos-policy-heading">19. Indemnification</h3>
                <p>
                  You agree to indemnify, defend, and hold harmless SUNRISE
                  Beverage, Shopify, and our affiliates, partners, officers,
                  directors, employees, agents, contractors, licensors, and
                  service providers from any losses, damages, liabilities, or
                  claims, including reasonable attorneys' fees, payable to
                  any third party due to or arising out of (1) your breach of
                  these Terms of Service or the documents they incorporate by
                  reference; (2) your violation of any law or the rights of a
                  third party; (3) your access to and use of the Services; or
                  (4) any consequence resulting from your consumption, use, or
                  misuse of our products.
                </p>
                <p>
                  We will notify you of any indemnifiable claim, provided
                  that a failure to promptly notify will not relieve you of
                  your obligations unless you are materially prejudiced. We
                  may control the defense and settlement of such claim at
                  your expense, including choice of counsel, but will not
                  settle any claim requiring non-monetary obligations from
                  you without your consent (not to be unreasonably withheld).
                  You will cooperate in the defense of indemnified claims,
                  including by providing relevant documents.
                </p>

                <h3 className="tos-policy-heading">20. Informal Dispute Resolution</h3>
                <p>
                  Before filing a claim against SUNRISE Beverage, you agree
                  to attempt to resolve the dispute informally by sending us
                  a written notice of your dispute ("Notice"). The Notice
                  must (a) describe the nature and basis of the claim; (b)
                  set forth the specific relief sought; and (c) include your
                  name, mailing address, email address, and any order numbers
                  or transaction details relevant to the dispute. The Notice
                  should be sent to:
                </p>
                <p className="tos-policy-address">
                  SUNRISE Beverage<br />
                  2032 Utica Square, Unit #52521<br />
                  Tulsa, OK 74114<br />
                  United States
                </p>
                <p>
                  Or by email to:{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  (with subject line "Dispute Notice")
                </p>
                <p>
                  You and SUNRISE Beverage agree to negotiate in good faith
                  to resolve the dispute. If we are unable to resolve the
                  dispute within thirty (30) days after the Notice is
                  received, either party may proceed with binding arbitration
                  as set forth in Section 21. Compliance with this Section 20
                  is a condition precedent to the initiation of arbitration.
                  The thirty-day informal-resolution period shall toll any
                  applicable statute of limitations.
                </p>

                <h3 className="tos-policy-heading">21. Binding Individual Arbitration</h3>
                <p>
                  <strong>21.1 Agreement to Arbitrate.</strong> You and
                  SUNRISE Beverage agree that any dispute, claim, or
                  controversy arising out of or relating to these Terms or the
                  breach, termination, enforcement, interpretation, or
                  validity thereof, or the use of the Services or purchase of
                  any products (collectively, "Disputes"), will be resolved
                  exclusively through final and binding individual
                  arbitration, except as set forth in Section 21.5 below.
                </p>
                <p>
                  <strong>21.2 Arbitration Rules and Forum.</strong> The
                  arbitration will be administered by JAMS pursuant to its
                  Streamlined Arbitration Rules and Procedures then in effect
                  (the "JAMS Rules") for claims that do not exceed $250,000,
                  and pursuant to its Comprehensive Arbitration Rules and
                  Procedures for claims that exceed $250,000. The JAMS Rules
                  are available at www.jamsadr.com. The arbitration will be
                  conducted by a single neutral arbitrator. The arbitration
                  will take place in Tulsa, Oklahoma, or at another location
                  mutually agreed by the parties, except that the arbitrator
                  may, at your written request, conduct the arbitration by
                  videoconference, telephone, or written submissions where
                  appropriate. Notwithstanding the foregoing, if the amount
                  in controversy is $25,000 or less, the arbitration shall be
                  conducted by written submissions and telephonic or
                  videoconference hearings only, unless the arbitrator
                  determines that an in-person hearing is necessary.
                </p>
                <p>
                  <strong>21.3 Federal Arbitration Act.</strong> This Section
                  21 (and the related provisions in Sections 22 and 23) is
                  governed by the Federal Arbitration Act, 9 U.S.C. §§ 1 et
                  seq. (the "FAA"). Judgment upon the arbitration award may
                  be entered in any court of competent jurisdiction.
                </p>
                <p>
                  <strong>21.4 Arbitrator's Authority.</strong> The arbitrator
                  shall have exclusive authority to resolve any Dispute,
                  including, without limitation, any claim that all or any
                  part of these Terms is void or voidable. The arbitrator
                  shall have the authority to grant any remedy that would
                  otherwise be available in court, except that the arbitrator
                  may not award relief that exceeds the limitations stated in
                  Section 18 (Limitation of Liability).
                </p>
                <p>
                  <strong>21.5 Exceptions to Arbitration.</strong>{" "}
                  Notwithstanding the foregoing, either party may bring an
                  individual action in small claims court for disputes within
                  that court's jurisdiction. In addition, either party may
                  seek emergency injunctive or other equitable relief in a
                  court of competent jurisdiction to prevent or address (a)
                  infringement, misappropriation, or violation of intellectual
                  property rights; or (b) unauthorized access to or use of
                  the Services. Disputes concerning the enforceability or
                  scope of the Class Action Waiver in Section 22 shall be
                  resolved by a court of competent jurisdiction, not the
                  arbitrator.
                </p>
                <p>
                  <strong>21.6 Costs.</strong> Each party will bear its own
                  attorneys' fees and costs in arbitration, except that the
                  arbitrator may award fees and costs to the prevailing party
                  as permitted by applicable law. The allocation of
                  arbitration filing fees, administrative fees, and arbitrator
                  compensation shall be governed by the JAMS Rules and JAMS
                  Consumer Arbitration Minimum Standards, where applicable.
                </p>
                <p>
                  <strong>21.7 30-Day Right to Opt Out.</strong> You have the
                  right to opt out of this Section 21 (Binding Individual
                  Arbitration) and Section 22 (Class Action Waiver) by sending
                  written notice of your decision to opt out to the address
                  in Section 20 within thirty (30) days after first becoming
                  subject to these Terms. Your opt-out notice must include
                  your full name, mailing address, email address, and a clear
                  statement that you wish to opt out of arbitration. If you
                  opt out under this Section 21.7, the remainder of these
                  Terms (including Section 23 (Waiver of Jury Trial) and
                  Section 31 (Governing Law)) will continue to apply to you.
                </p>

                <h3 className="tos-policy-heading">22. Class Action Waiver</h3>
                <p className="tos-policy-allcaps">
                  YOU AND SUNRISE BEVERAGE AGREE THAT EACH MAY BRING CLAIMS
                  AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS
                  A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS,
                  COLLECTIVE, OR REPRESENTATIVE ACTION OR PROCEEDING. UNLESS
                  BOTH YOU AND SUNRISE BEVERAGE OTHERWISE AGREE IN WRITING,
                  THE ARBITRATOR MAY NOT CONSOLIDATE OR JOIN MORE THAN ONE
                  PERSON'S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM
                  OF A CONSOLIDATED, REPRESENTATIVE, OR CLASS PROCEEDING. THE
                  ARBITRATOR MAY AWARD RELIEF (INCLUDING MONETARY,
                  INJUNCTIVE, AND DECLARATORY RELIEF) ONLY IN FAVOR OF THE
                  INDIVIDUAL PARTY SEEKING RELIEF AND ONLY TO THE EXTENT
                  NECESSARY TO PROVIDE RELIEF NECESSITATED BY THAT PARTY'S
                  INDIVIDUAL CLAIM.
                </p>
                <p>
                  If a court of competent jurisdiction finds that this Class
                  Action Waiver is unenforceable as to any particular claim
                  or request for relief, then that claim or request for
                  relief (and only that claim or request for relief) shall be
                  severed from the arbitration and may be brought in court,
                  while all other claims and requests for relief shall remain
                  subject to arbitration.
                </p>

                <h3 className="tos-policy-heading">23. Waiver of Jury Trial</h3>
                <p className="tos-policy-allcaps">
                  YOU AND SUNRISE BEVERAGE EACH WAIVE ANY CONSTITUTIONAL AND
                  STATUTORY RIGHTS TO HAVE A DISPUTE RESOLVED IN COURT BEFORE
                  A JUDGE OR JURY. YOU AND SUNRISE BEVERAGE ARE INSTEAD
                  ELECTING TO RESOLVE DISPUTES THROUGH ARBITRATION, WHICH
                  PROCEEDS ON A DIFFERENT BASIS THAN A LAWSUIT IN COURT.
                </p>

                <h3 className="tos-policy-heading">24. Statute of Limitations</h3>
                <p className="tos-policy-allcaps">
                  ANY CLAIM OR CAUSE OF ACTION ARISING OUT OF OR RELATED TO
                  YOUR USE OF THE SERVICES OR THESE TERMS MUST BE FILED
                  WITHIN ONE (1) YEAR AFTER SUCH CLAIM OR CAUSE OF ACTION
                  AROSE; OTHERWISE, SUCH CLAIM OR CAUSE OF ACTION IS
                  PERMANENTLY BARRED. THIS LIMITATION APPLIES TO THE FULLEST
                  EXTENT PERMITTED BY APPLICABLE LAW.
                </p>

                <h3 className="tos-policy-heading">25. DMCA / Copyright Takedown</h3>
                <p>
                  If you believe that any content on the Services infringes
                  your copyright, please send a notice in accordance with the
                  Digital Millennium Copyright Act (17 U.S.C. § 512) ("DMCA")
                  to our designated agent, with the following information:
                </p>
                <ol className="tos-policy-list-ordered">
                  <li>A description of the copyrighted work that you claim has been infringed;</li>
                  <li>A description of where the material that you claim is infringing is located on the Services (including the exact URL);</li>
                  <li>Your name, mailing address, telephone number, and email address;</li>
                  <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;</li>
                  <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or are authorized to act on the copyright owner's behalf;</li>
                  <li>Your physical or electronic signature.</li>
                </ol>
                <p>Designated DMCA Agent:</p>
                <p className="tos-policy-address">
                  SUNRISE Beverage — Attn: DMCA Agent<br />
                  2032 Utica Square, Unit #52521<br />
                  Tulsa, OK 74114<br />
                  United States<br />
                  Email:{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  (subject line: "DMCA Notice")
                </p>
                <p>
                  We may, in appropriate circumstances and in our sole
                  discretion, terminate the account of any user who is
                  determined to be a repeat infringer.
                </p>

                <h3 className="tos-policy-heading">26. Severability</h3>
                <p>
                  In the event that any provision of these Terms of Service
                  is determined to be unlawful, void, or unenforceable, such
                  provision shall nonetheless be enforceable to the fullest
                  extent permitted by applicable law, and the unenforceable
                  portion shall be deemed to be severed from these Terms of
                  Service. Such determination shall not affect the validity
                  and enforceability of any other remaining provisions.
                </p>

                <h3 className="tos-policy-heading">27. Waiver; Entire Agreement</h3>
                <p>
                  The failure of us to exercise or enforce any right or
                  provision of these Terms of Service shall not constitute a
                  waiver of such right or provision.
                </p>
                <p>
                  These Terms of Service and any policies or operating rules
                  posted by us on this site or in respect to the Service
                  constitute the entire agreement and understanding between
                  you and us and govern your use of the Service, superseding
                  any prior or contemporaneous agreements, communications,
                  and proposals, whether oral or written, between you and us
                  (including, but not limited to, any prior versions of the
                  Terms of Service).
                </p>
                <p>
                  Any ambiguities in the interpretation of these Terms of
                  Service shall not be construed against the drafting party.
                </p>

                <h3 className="tos-policy-heading">28. Assignment</h3>
                <p>
                  You may not delegate, transfer, or assign this Agreement or
                  any of your rights or obligations under these Terms without
                  our prior written consent, and any such attempt will be
                  null and void. We may transfer, assign, or delegate these
                  Terms and our rights and obligations without consent or
                  notice to you.
                </p>

                <h3 className="tos-policy-heading">29. Governing Law</h3>
                <p>
                  These Terms of Service and any separate agreements whereby
                  we provide you Services shall be governed by and construed
                  in accordance with the federal laws of the United States
                  and the laws of the State of Oklahoma, without regard to
                  its conflict-of-laws principles. Subject to Sections 20
                  through 23 (which require binding arbitration of most
                  disputes), you and SUNRISE Beverage consent to the
                  exclusive personal jurisdiction and venue of the state and
                  federal courts located in Tulsa County, Oklahoma for any
                  action that is not subject to arbitration under these
                  Terms.
                </p>

                <h3 className="tos-policy-heading">30. Headings</h3>
                <p>
                  The headings used in this agreement are included for
                  convenience only and will not limit or otherwise affect
                  these Terms.
                </p>

                <h3 className="tos-policy-heading">31. Changes to Terms of Service</h3>
                <p>
                  You can review the most current version of the Terms of
                  Service at any time on this page.
                </p>
                <p>
                  We reserve the right, in our sole discretion, to update,
                  change, or replace any part of these Terms of Service by
                  posting updates and changes to our website. It is your
                  responsibility to check our website periodically for
                  changes. We will notify you of any material changes to
                  these Terms in accordance with applicable law, and such
                  changes will be effective on the date specified in the
                  notice. Your continued use of or access to the Services
                  following the posting of any changes to these Terms of
                  Service constitutes acceptance of those changes.{" "}
                  <strong>
                    Material changes to the arbitration provisions in
                    Sections 20 through 23 will not apply retroactively to
                    any dispute of which we have notice on the effective date
                    of the change.
                  </strong>
                </p>

                <h3 className="tos-policy-heading">32. Contact Information</h3>
                <p>
                  Questions about these Terms of Service should be directed
                  to us. You may call us at{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>, email us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  , or write to us at:
                </p>
                <p className="tos-policy-address">
                  SUNRISE Beverage<br />
                  2032 Utica Square, Unit #52521<br />
                  Tulsa, OK 74114<br />
                  United States
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
