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
          "The terms governing your use of the SUNRISE Beverage store and website. Includes site access requirements, ordering, shipping, intellectual property, warranties, and liability.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/terms-of-service" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// Structural mirror of /privacy-policy and /refund-policy: SiteHeader →
// tier-30 pagehero with animated character entrance → cream policy body in
// 68ch reading column → SiteFooter. Class prefix .tos-* parallel to .pp-*
// (Privacy) and .rp-* (Refund). Tier-30 green is the Support/Policy
// category color shared across all three policy pages.
//
// Source: Shopify ToS template, customized per founder direction:
//   · Entity name "Sunrise Seltzers" → "SUNRISE Beverage" throughout
//   · Contact details (email, phone, address) updated to SUNRISE Beverage
//   · Section 1 age representation rewritten to 21+ for site access
//     (matches site-wide 21+ Age Gate); minor-dependents clause deleted
//   · Section 5 Shipping rewritten to reference forthcoming Shipping Policy
//   · Section 13(e) revised to allow agents per Section 14 (struck the
//     conflicting "AI tools (such as agentic AI) or" language)
//   · Section 22 left generic ("the jurisdiction where SUNRISE Beverage
//     is headquartered")
//   · Section 25 reformatted to prose to match Privacy Policy contact style
//   · Business registration / VAT lines removed
//   · Sections 16 and 17 retained in ALL CAPS for legal conspicuousness
function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        {/* Tier-30 green flood — Support/Policy category color, matching   */}
        {/* /privacy-policy and /refund-policy. 5-character "Terms" entrance.*/}
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
                <strong>Last updated:</strong> April 27, 2026
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
                  Please read these Terms of Service carefully, as they
                  include important information about your legal rights and
                  cover areas such as warranty disclaimers and limitations of
                  liability.
                </p>
                <p>
                  By visiting, interacting with, or using our Services, you
                  agree to be bound by these Terms of Service and our{" "}
                  <a href="/privacy-policy">Privacy Policy</a>. If you do not
                  agree to these Terms of Service or Privacy Policy, you
                  should not use or access our Services.
                </p>

                <h3 className="tos-policy-heading">1. Access and Account</h3>
                <p>
                  By agreeing to these Terms of Service, you represent that
                  you are at least 21 years of age. The Services, including
                  this website and any products offered through it, are
                  intended exclusively for individuals 21 and older.
                </p>
                <p>
                  To use the Services, including accessing or browsing our
                  online stores or purchasing any of the products or services
                  we offer, you may be asked to provide certain information,
                  such as your email address, billing, payment, and shipping
                  information. You represent and warrant that all the
                  information you provide in our stores is correct, current,
                  and complete and that you have all rights necessary to
                  provide this information.
                </p>
                <p>
                  You are solely responsible for maintaining the security of
                  your account credentials and for all of your account
                  activity. You may not transfer, sell, assign, or license
                  your account to any other person.
                </p>

                <h3 className="tos-policy-heading">2. Our Products</h3>
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
                </p>

                <h3 className="tos-policy-heading">3. Orders</h3>
                <p>
                  When you place an order, you are making an offer to
                  purchase. SUNRISE Beverage reserves the right to accept or
                  decline your order for any reason at its discretion. Your
                  order is not accepted until SUNRISE Beverage confirms
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

                <h3 className="tos-policy-heading">4. Prices and Billing</h3>
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
                  your account and other information, including your email
                  address, credit card numbers, and expiration dates, so that
                  we can complete your transactions and contact you as
                  needed.
                </p>
                <p>
                  You represent and warrant that (i) the credit card
                  information you provide is true, correct, and complete,
                  (ii) you are duly authorized to use such credit card for
                  the purchase, (iii) charges incurred by you will be honored
                  by your credit card company, and (iv) you will pay charges
                  incurred by you at the posted prices, including shipping
                  and handling charges and all applicable taxes, if any.
                </p>

                <h3 className="tos-policy-heading">5. Shipping and Delivery</h3>
                <p>
                  Shipping methods, delivery timelines, carrier handling, and
                  related terms are governed by our Shipping Policy. Please
                  refer to our Shipping Policy for full details.
                </p>

                <h3 className="tos-policy-heading">6. Intellectual Property</h3>
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

                <h3 className="tos-policy-heading">7. Optional Tools</h3>
                <p>
                  You may be provided with access to customer tools offered
                  by third parties as part of the Services, which we neither
                  monitor nor have any control nor input over.
                </p>
                <p>
                  You acknowledge and agree that we provide access to such
                  tools "as is" and "as available" without any warranties,
                  representations, or conditions of any kind and without any
                  endorsement. We shall have no liability whatsoever arising
                  from or relating to your use of optional third-party tools.
                </p>
                <p>
                  Any use by you of the optional tools offered through the
                  site is entirely at your own risk and discretion, and you
                  should ensure that you are familiar with and approve of the
                  terms on which tools are provided by the relevant
                  third-party provider(s).
                </p>
                <p>
                  We may also, in the future, offer new features through the
                  Services (including the release of new tools and
                  resources). Such new features shall also be deemed part of
                  the Services and are subject to these Terms of Service.
                </p>

                <h3 className="tos-policy-heading">8. Third-Party Links</h3>
                <p>
                  The Services may contain materials and hyperlinks to
                  websites provided or operated by third parties (including
                  any embedded third-party functionality). We are not
                  responsible for examining or evaluating the content or
                  accuracy of any third-party materials or websites you
                  choose to access. If you decide to leave the Services to
                  access these materials or third-party sites, you do so at
                  your own risk.
                </p>
                <p>
                  We are not liable for any harm or damages related to your
                  access of any third-party websites, or your purchase or use
                  of any products, services, resources, or content on any
                  third-party websites. Please review carefully the
                  third-party's policies and practices and make sure you
                  understand them before you engage in any transaction.
                  Complaints, claims, concerns, or questions regarding
                  third-party products and services should be directed to the
                  third-party.
                </p>

                <h3 className="tos-policy-heading">9. Relationship with Shopify</h3>
                <p>
                  SUNRISE Beverage is powered by Shopify, which enables us to
                  provide the Services to you. However, any sales and
                  purchases you make in our Store are made directly with
                  SUNRISE Beverage. By using the Services, you acknowledge
                  and agree that Shopify is not responsible for any aspect of
                  any sales between you and SUNRISE Beverage, including any
                  injury, damage, or loss resulting from purchased products
                  and services. You hereby expressly release Shopify and its
                  affiliates from all claims, damages, and liabilities
                  arising from or related to your purchases and transactions
                  with SUNRISE Beverage.
                </p>

                <h3 className="tos-policy-heading">10. Privacy Policy</h3>
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
                <p>
                  Because the Services are hosted by Shopify, Shopify
                  collects and processes personal information about your
                  access to and use of the Services in order to provide and
                  improve the Services for you. Information you submit to the
                  Services will be transmitted to and shared with Shopify as
                  well as third parties that may be located in countries
                  other than where you reside, in order to provide services
                  to you. Review our{" "}
                  <a href="/privacy-policy">Privacy Policy</a> for more
                  details on how we, Shopify, and our partners use your
                  personal information.
                </p>

                <h3 className="tos-policy-heading">11. Feedback</h3>
                <p>
                  If you submit, upload, post, email, or otherwise transmit
                  any ideas, suggestions, feedback, reviews, proposals,
                  plans, or other content (collectively, "Feedback"), you
                  grant us a perpetual, worldwide, sublicensable,
                  royalty-free license to use, reproduce, modify, publish,
                  distribute, and display such Feedback in any medium for any
                  purpose, including for commercial use. We may, for example,
                  use our rights under this license to operate, provide,
                  evaluate, enhance, improve, and promote the Services and to
                  perform our obligations and exercise our rights under the
                  Terms of Service.
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
                <p>
                  You agree that your Feedback will not violate any right of
                  any third party, including copyright, trademark, privacy,
                  personality, or other personal or proprietary right. You
                  further agree that your Feedback will not contain libelous
                  or otherwise unlawful, abusive, or obscene content, or
                  contain any computer virus or other malware that could in
                  any way affect the operation of the Services or any related
                  website. You may not use a false email address, pretend to
                  be someone other than yourself, or otherwise mislead us or
                  third parties as to the origin of any Feedback. You are
                  solely responsible for any Feedback you make and its
                  accuracy. We take no responsibility and assume no liability
                  for any Feedback posted by you or any third party.
                </p>

                <h3 className="tos-policy-heading">12. Errors, Inaccuracies, and Omissions</h3>
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

                <h3 className="tos-policy-heading">13. Prohibited Uses</h3>
                <p>
                  You may access and use the Services for lawful purposes
                  only. You may not access or use the Services, directly or
                  indirectly: (a) for any unlawful or malicious purpose; (b)
                  to violate any international, federal, provincial, or state
                  regulations, rules, laws, or local ordinances; (c) to
                  infringe upon or violate our intellectual property rights
                  or the intellectual property rights of others; (d) to
                  harass, abuse, insult, harm, defame, slander, disparage,
                  intimidate, or harm any of our employees or any other
                  person; (e) to transmit false or misleading information;
                  (f) to send, knowingly receive, upload, download, use, or
                  re-use any material that does not comply with these Terms;
                  (g) to transmit, or procure the sending of, any advertising
                  or promotional material, including any "junk mail," "chain
                  letter," "spam," or any other similar solicitation; (h) to
                  impersonate or attempt to impersonate any other person or
                  entity; or (i) to engage in any other conduct that
                  restricts or inhibits anyone's use or enjoyment of the
                  Services, or which, as determined by us, may harm SUNRISE
                  Beverage, Shopify, or users of the Services, or expose them
                  to liability.
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
                  Section 14 (Agents); or (f) interfere with, bypass, or
                  circumvent the security or authorization features, robot
                  exclusion headers, or other measures we employ to restrict
                  access to the Services. We reserve the right to suspend,
                  disable, or terminate your account at any time, without
                  notice, if we determine that you have violated any part of
                  these Terms.
                </p>

                <h3 className="tos-policy-heading">14. Agents</h3>
                <p>
                  <strong>14.1</strong> This section ("Agent Terms") applies
                  if you use, allow, enable, or cause the deployment of an
                  Agent to access, use, or interact with any Services.
                  "Agent" means any software or service that takes autonomous
                  or semi-autonomous action on behalf of, or at the
                  instruction of, any person or entity and that can be
                  executed on behalf of or using a person's device, without
                  direct supervision.
                </p>
                <p>
                  <strong>14.2</strong> No Agent may access, use, or interact
                  with Services unless, at all times, it identifies itself
                  and operates in strict accordance with the requirements in
                  Section 14.4 below. In addition, no Agent may access, use,
                  or interact with Services if we have requested that the
                  Agent refrain from accessing, using, or interacting with
                  any service.
                </p>
                <p>
                  <strong>14.3</strong> We may limit, including by technical
                  measures, whether and how any Agent accesses, uses, and
                  interacts with Services.
                </p>
                <p>
                  <strong>14.4</strong> Agents must: (i) in all HTTP/HTTPS
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

                <h3 className="tos-policy-heading">15. Termination</h3>
                <p>
                  We may terminate this agreement or your access to the
                  Services (or any part thereof) in our sole discretion at
                  any time without notice, and you will remain liable for all
                  amounts due up to and including the date of termination.
                </p>
                <p>
                  The following sections will continue to apply following any
                  termination: Intellectual Property, Feedback, Termination,
                  Disclaimer of Warranties, Limitation of Liability,
                  Indemnification, Severability, Waiver; Entire Agreement,
                  Assignment, Governing Law, Privacy Policy, and any other
                  provisions that by their nature should survive termination.
                </p>

                <h3 className="tos-policy-heading">16. Disclaimer of Warranties</h3>
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

                <h3 className="tos-policy-heading">17. Limitation of Liability</h3>
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
                  SERVICES OR ANY PRODUCT, INCLUDING, BUT NOT LIMITED TO, ANY
                  ERRORS OR OMISSIONS IN ANY CONTENT, OR ANY LOSS OR DAMAGE
                  OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SERVICES
                  OR ANY CONTENT (OR PRODUCT) POSTED, TRANSMITTED, OR
                  OTHERWISE MADE AVAILABLE VIA THE SERVICES, EVEN IF ADVISED
                  OF THEIR POSSIBILITY.
                </p>

                <h3 className="tos-policy-heading">18. Indemnification</h3>
                <p>
                  You agree to indemnify, defend, and hold harmless SUNRISE
                  Beverage, Shopify, and our affiliates, partners, officers,
                  directors, employees, agents, contractors, licensors, and
                  service providers from any losses, damages, liabilities, or
                  claims, including reasonable attorneys' fees, payable to
                  any third party due to or arising out of (1) your breach of
                  these Terms of Service or the documents they incorporate by
                  reference, (2) your violation of any law or the rights of a
                  third party, or (3) your access to and use of the Services.
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

                <h3 className="tos-policy-heading">19. Severability</h3>
                <p>
                  In the event that any provision of these Terms of Service
                  is determined to be unlawful, void, or unenforceable, such
                  provision shall nonetheless be enforceable to the fullest
                  extent permitted by applicable law, and the unenforceable
                  portion shall be deemed to be severed from these Terms of
                  Service. Such determination shall not affect the validity
                  and enforceability of any other remaining provisions.
                </p>

                <h3 className="tos-policy-heading">20. Waiver; Entire Agreement</h3>
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

                <h3 className="tos-policy-heading">21. Assignment</h3>
                <p>
                  You may not delegate, transfer, or assign this Agreement or
                  any of your rights or obligations under these Terms without
                  our prior written consent, and any such attempt will be
                  null and void. We may transfer, assign, or delegate these
                  Terms and our rights and obligations without consent or
                  notice to you.
                </p>

                <h3 className="tos-policy-heading">22. Governing Law</h3>
                <p>
                  These Terms of Service and any separate agreements whereby
                  we provide you Services shall be governed by and construed
                  in accordance with the federal and state or territorial
                  laws applicable in the jurisdiction where SUNRISE Beverage
                  is headquartered. You and SUNRISE Beverage consent to venue
                  and personal jurisdiction in such courts.
                </p>

                <h3 className="tos-policy-heading">23. Headings</h3>
                <p>
                  The headings used in this agreement are included for
                  convenience only and will not limit or otherwise affect
                  these Terms.
                </p>

                <h3 className="tos-policy-heading">24. Changes to Terms of Service</h3>
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
                  Service constitutes acceptance of those changes.
                </p>

                <h3 className="tos-policy-heading">25. Contact Information</h3>
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
