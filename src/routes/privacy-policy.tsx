import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./privacy-policy.css";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy · SUNRISE" },
      {
        name: "description",
        content:
          "How SUNRISE Beverage collects, uses, and discloses your personal information. Includes Notice at Collection, sensitive PI handling, age verification, retention periods, and state-specific privacy rights.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/privacy-policy" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// Structural mirror of /shipping-policy, /refund-policy, /terms-of-service.
// v2 (this revision): comprehensive rewrite. Adds CCPA-style Notice at
// Collection, Sensitive Personal Information section, dedicated Sale/Sharing
// section, Cookies and Tracking Technologies, SMS section (cross-references
// /sms-marketing-policy), retention timelines, state-specific disclosures
// (California, multi-state, Nevada). Class set unchanged from v1.
function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="pp-pagehero">
          <h1 className="pp-pagehero-title" aria-label="Privacy">
            {"Privacy".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="pp-policy">
          <div className="container">
            <div className="pp-policy-inner">
              <h2 className="pp-policy-title">Privacy Policy</h2>

              <p className="pp-policy-effective">
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="pp-policy-body">
                <p>
                  SUNRISE Beverage operates this store and website, including
                  all related information, content, features, tools, products,
                  and services in order to provide you, the customer, with a
                  curated shopping experience (the "Services"). SUNRISE
                  Beverage is powered by Shopify, which enables us to provide
                  the Services to you. This Privacy Policy describes how we
                  collect, use, and disclose your personal information when
                  you visit, use, or make a purchase or other transaction
                  using the Services or otherwise communicate with us. If
                  there is a conflict between our Terms of Service and this
                  Privacy Policy, this Privacy Policy controls with respect to
                  the collection, processing, and disclosure of your personal
                  information.
                </p>
                <p>
                  Please read this Privacy Policy carefully. By using and
                  accessing any of the Services, you acknowledge that you have
                  read this Privacy Policy and understand the collection, use,
                  and disclosure of your information as described in this
                  Privacy Policy.
                </p>

                <h3 className="pp-policy-heading">Notice at Collection</h3>
                <p>
                  At or before the point of collection, we may collect the
                  following categories of personal information:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Identifiers</strong> (name, postal address, email
                    address, account name, IP address, online identifiers)
                  </li>
                  <li>
                    <strong>Customer records</strong> (billing/shipping
                    address, payment information, telephone number)
                  </li>
                  <li>
                    <strong>Commercial information</strong> (products
                    purchased, cart contents, transaction history)
                  </li>
                  <li>
                    <strong>Internet or electronic network activity</strong>{" "}
                    (browsing history, search history, interaction data)
                  </li>
                  <li>
                    <strong>Geolocation data</strong> (general location based
                    on IP address)
                  </li>
                  <li>
                    <strong>Audio, electronic, visual, or similar information</strong>{" "}
                    (when you contact customer service or upload an ID for age
                    verification)
                  </li>
                  <li>
                    <strong>Inferences</strong> drawn from any of the above to
                    create a consumer profile
                  </li>
                </ul>
                <p>
                  We use this information for the purposes described in the
                  "How We Use Your Personal Information" section below. We
                  retain personal information for the periods described in the
                  "Retention" section below. We do not sell personal
                  information for monetary consideration; however, our use of
                  certain advertising technologies may be considered "sharing"
                  under applicable state privacy laws, as described in the
                  "Your Rights and Choices" section.
                </p>

                <h3 className="pp-policy-heading">Personal Information We Collect or Process</h3>
                <p>
                  When we use the term "personal information," we are
                  referring to information that identifies or can reasonably
                  be linked to you or another person. Personal information
                  does not include information that is collected anonymously
                  or that has been de-identified, so that it cannot identify
                  or be reasonably linked to you. We may collect or process
                  the following categories of personal information, including
                  inferences drawn from this personal information, depending
                  on how you interact with the Services, where you live, and
                  as permitted or required by applicable law:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Contact details</strong> including your name,
                    address, billing address, shipping address, phone number,
                    and email address.
                  </li>
                  <li>
                    <strong>Financial information</strong> including credit
                    card, debit card, and financial account numbers, payment
                    card information, financial account information,
                    transaction details, form of payment, payment
                    confirmation, and other payment details.
                  </li>
                  <li>
                    <strong>Account information</strong> including your
                    username, password, security questions, preferences, and
                    settings.
                  </li>
                  <li>
                    <strong>Transaction information</strong> including the
                    items you view, put in your cart, add to your wishlist, or
                    purchase, return, exchange, or cancel and your past
                    transactions.
                  </li>
                  <li>
                    <strong>Communications with us</strong> including the
                    information you include in communications with us, for
                    example, when sending a customer support inquiry.
                  </li>
                  <li>
                    <strong>Device information</strong> including information
                    about your device, browser, or network connection, your IP
                    address, and other unique identifiers.
                  </li>
                  <li>
                    <strong>Usage information</strong> including information
                    regarding your interaction with the Services, including
                    how and when you interact with or navigate the Services.
                  </li>
                  <li>
                    <strong>Age-verification information</strong> including
                    date of birth, and (in certain cases) a photograph of a
                    government-issued identification document submitted to our
                    third-party age-verification provider.
                  </li>
                </ul>

                <h3 className="pp-policy-heading">Sensitive Personal Information</h3>
                <p>
                  In limited circumstances we may collect or process the
                  following categories of "sensitive personal information" as
                  defined under applicable state privacy law:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Government-issued identification numbers</strong>{" "}
                    (such as a driver's license number) when submitted to our
                    third-party age-verification provider.
                  </li>
                  <li>
                    <strong>Financial account information</strong> (in
                    connection with payment processing).
                  </li>
                  <li>
                    <strong>Precise geolocation</strong> (only if you
                    affirmatively grant permission).
                  </li>
                </ul>
                <p>
                  We use sensitive personal information only for the purposes
                  for which it was collected (age verification, payment
                  processing, fraud prevention, and to comply with law). We do
                  not use sensitive personal information for the purpose of
                  inferring characteristics about you. You have the right to
                  limit our use of sensitive personal information as described
                  in the "Your Rights and Choices" section.
                </p>

                <h3 className="pp-policy-heading">Personal Information Sources</h3>
                <p>We may collect personal information from the following sources:</p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Directly from you</strong> including when you
                    create an account, visit or use the Services, communicate
                    with us, complete age verification, or otherwise provide
                    us with your personal information.
                  </li>
                  <li>
                    <strong>Automatically through the Services</strong>{" "}
                    including from your device when you use our products or
                    services or visit our websites, and through the use of
                    cookies and similar technologies.
                  </li>
                  <li>
                    <strong>From our service providers</strong> including when
                    we engage them to enable certain technology (including age
                    verification, payment processing, and shipping) and when
                    they collect or process your personal information on our
                    behalf.
                  </li>
                  <li>
                    <strong>From our partners or other third parties.</strong>
                  </li>
                </ul>

                <h3 className="pp-policy-heading">How We Use Your Personal Information</h3>
                <p>
                  Depending on how you interact with us or which of the
                  Services you use, we may use personal information for the
                  following purposes:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Provide, Tailor, and Improve the Services.</strong>{" "}
                    To provide you with the Services, perform our contract
                    with you, process your payments, fulfill your orders,
                    remember your preferences and items you are interested in,
                    send notifications related to your account, process
                    purchases, returns, exchanges, or other transactions,
                    manage your account, arrange for shipping, facilitate any
                    returns and exchanges, enable you to post reviews, and
                    create a customized shopping experience.
                  </li>
                  <li>
                    <strong>Age Verification and Compliance.</strong> To
                    verify your age at the point of entry, at checkout, and at
                    delivery, and to comply with applicable hemp, cannabis,
                    and consumer-protection laws.
                  </li>
                  <li>
                    <strong>Marketing and Advertising.</strong> To send
                    marketing, advertising, and promotional communications by
                    email, text message, or postal mail, and to show you
                    online advertisements for products or services on the
                    Services or other websites, including based on items you
                    previously have purchased or added to your cart and other
                    activity on the Services.
                  </li>
                  <li>
                    <strong>Security and Fraud Prevention.</strong> To
                    authenticate your account, provide a secure payment and
                    shopping experience, detect, investigate, or take action
                    regarding possible fraudulent, illegal, unsafe, or
                    malicious activity, protect public safety, and secure our
                    services. If you choose to use the Services and register
                    an account, you are responsible for keeping your account
                    credentials safe.
                  </li>
                  <li>
                    <strong>Communicating with You.</strong> To provide you
                    with customer support, be responsive to you, provide
                    effective services to you, and maintain our business
                    relationship with you.
                  </li>
                  <li>
                    <strong>Legal Reasons.</strong> To comply with applicable
                    law or respond to valid legal process, including requests
                    from law enforcement or government agencies, to
                    investigate or participate in civil discovery, potential
                    or actual litigation, or other adversarial legal
                    proceedings, and to enforce or investigate potential
                    violations of our terms or policies.
                  </li>
                </ul>

                <h3 className="pp-policy-heading">How We Disclose Personal Information</h3>
                <p>
                  In certain circumstances, we may disclose your personal
                  information to third parties for legitimate purposes subject
                  to this Privacy Policy. Such circumstances may include:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Service providers</strong>, including Shopify, our
                    age-verification provider, payment processors, fulfillment
                    and shipping vendors, IT and cloud hosting providers,
                    customer-support platforms, marketing-services providers,
                    and analytics providers, who perform services on our
                    behalf.
                  </li>
                  <li>
                    <strong>Business and marketing partners</strong> to
                    provide marketing services and advertise to you. For
                    example, we use Shopify to support personalized
                    advertising with third-party services based on your online
                    activity with different merchants and websites. Our
                    business and marketing partners will use your information
                    in accordance with their own privacy notices. Depending on
                    where you reside, you may have a right to direct us not to
                    share information about you to show you targeted
                    advertisements and marketing based on your online activity
                    with different merchants and websites.
                  </li>
                  <li>
                    <strong>At your direction</strong> when you direct,
                    request us, or otherwise consent to our disclosure of
                    certain information to third parties, such as to ship you
                    products or through your use of social media widgets or
                    login integrations.
                  </li>
                  <li>
                    <strong>With our affiliates</strong> or otherwise within
                    our corporate group.
                  </li>
                  <li>
                    <strong>In connection with a business transaction</strong>{" "}
                    such as a merger, acquisition, restructuring, or
                    bankruptcy.
                  </li>
                  <li>
                    <strong>For legal and safety reasons</strong>, including
                    to comply with any applicable legal obligations (including
                    responding to subpoenas, search warrants, and similar
                    requests), to enforce any applicable terms of service or
                    policies, and to protect or defend the Services, our
                    rights, and the rights of our users or others.
                  </li>
                </ul>

                <h3 className="pp-policy-heading">Sale or Sharing of Personal Information</h3>
                <p>
                  We do not sell personal information for monetary
                  consideration. We may "share" personal information for
                  "cross-context behavioral advertising" (as those terms are
                  defined under the California Privacy Rights Act and similar
                  state laws) when we use third-party advertising tools and
                  analytics. You may opt out of this sharing at any time by
                  following the instructions in the "Your Rights and Choices"
                  section, including by clicking the{" "}
                  <strong>"Do Not Sell or Share My Personal Information"</strong>{" "}
                  link in our website footer.
                </p>
                <p>
                  We do not knowingly sell or share the personal information
                  of consumers under 16 years of age. As a 21+ product, we do
                  not knowingly collect personal information from anyone under
                  21 (see "Children's Data" below).
                </p>

                <h3 className="pp-policy-heading">Cookies and Tracking Technologies</h3>
                <p>
                  We and our service providers use cookies and similar
                  technologies to operate the Services and to collect
                  information about your activity on the Services. Cookies
                  fall into the following categories:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Strictly necessary cookies</strong> are required
                    for the Services to function (e.g., shopping cart,
                    checkout, authentication). These cannot be disabled
                    without breaking core functionality.
                  </li>
                  <li>
                    <strong>Performance and analytics cookies</strong> help us
                    understand how visitors interact with the Services and
                    improve them.
                  </li>
                  <li>
                    <strong>Functional cookies</strong> allow us to remember
                    your preferences (e.g., region, language).
                  </li>
                  <li>
                    <strong>Advertising cookies</strong> are used to deliver
                    relevant advertisements and measure their effectiveness,
                    including by sharing information with our advertising
                    partners.
                  </li>
                </ul>
                <p>
                  You can manage your cookie preferences through your browser
                  settings or, where available, through a cookie-preferences
                  tool on our website. Disabling certain cookies may affect
                  functionality. We do not currently respond to "Do Not Track"
                  browser signals; however, we honor opt-out preference
                  signals (such as Global Privacy Control / "GPC") for opting
                  out of "sale" and "sharing" of personal information where
                  required by law.
                </p>

                <h3 className="pp-policy-heading">Relationship with Shopify</h3>
                <p>
                  The Services are hosted by Shopify, which collects and
                  processes personal information about your access to and use
                  of the Services in order to provide and improve the Services
                  for you. Information you submit to the Services will be
                  transmitted to and shared with Shopify as well as third
                  parties that may be located in countries other than where
                  you reside, in order to provide and improve the Services for
                  you. In addition, to help protect, grow, and improve our
                  business, we use certain Shopify enhanced features that
                  incorporate data and information obtained from your
                  interactions with our Store, along with other merchants and
                  with Shopify. To provide these enhanced features, Shopify
                  may make use of personal information collected about your
                  interactions with our Store, along with other merchants, and
                  with Shopify. In these circumstances, Shopify is responsible
                  for the processing of your personal information, including
                  for responding to your requests to exercise your rights over
                  use of your personal information for these purposes. To
                  learn more about how Shopify uses your personal information
                  and any rights you may have, you can visit the{" "}
                  <a
                    href="https://privacy.shopify.com/en"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Shopify Consumer Privacy Policy
                  </a>
                  . Depending on where you live, you may exercise certain
                  rights with respect to your personal information through the{" "}
                  <a
                    href="https://privacy.shopify.com/en"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Shopify Privacy Portal
                  </a>
                  .
                </p>

                <h3 className="pp-policy-heading">Third Party Websites and Links</h3>
                <p>
                  The Services may provide links to websites or other online
                  platforms operated by third parties. If you follow links to
                  sites not affiliated or controlled by us, you should review
                  their privacy and security policies and other terms and
                  conditions. We do not guarantee and are not responsible for
                  the privacy or security of such sites, including the
                  accuracy, completeness, or reliability of information found
                  on these sites. Information you provide on public or
                  semi-public venues, including information you share on
                  third-party social networking platforms, may also be
                  viewable by other users of the Services and/or users of
                  those third-party platforms without limitation as to its use
                  by us or by a third party. Our inclusion of such links does
                  not, by itself, imply any endorsement of the content on such
                  platforms or of their owners or operators, except as
                  disclosed on the Services.
                </p>

                <h3 className="pp-policy-heading">SMS and Text-Message Communications</h3>
                <p>
                  By providing your mobile telephone number to us and opting
                  in to receive text messages from SUNRISE Beverage, you
                  consent to receive recurring marketing and promotional text
                  messages from us at the number provided. Consent is not a
                  condition of any purchase. Message frequency varies. Message
                  and data rates may apply.
                </p>
                <p>
                  You can opt out at any time by replying{" "}
                  <strong>STOP</strong> to any of our messages. You can
                  request additional information by replying{" "}
                  <strong>HELP</strong> or by contacting us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  . For full SMS terms, see our{" "}
                  <a href="/sms-marketing-policy">SMS Marketing Policy</a>.
                </p>

                <h3 className="pp-policy-heading">Children's Data</h3>
                <p>
                  The Services are not intended to be used by individuals
                  under the age of 21, and we do not knowingly collect any
                  personal information from individuals under 21. If you are
                  the parent or guardian of a person under 21 who has provided
                  us with their personal information, you may contact us using
                  the contact details set out below to request that it be
                  deleted.
                </p>

                <h3 className="pp-policy-heading">Security and Retention of Your Information</h3>
                <p>
                  We maintain administrative, technical, and physical
                  safeguards designed to protect personal information from
                  accidental loss and from unauthorized access, use,
                  alteration, and disclosure. Please be aware that no security
                  measures are perfect or impenetrable, and we cannot
                  guarantee "perfect security." In addition, any information
                  you send to us may not be secure while in transit. We
                  recommend that you do not use unsecure channels to
                  communicate sensitive or confidential information to us.
                </p>
                <p>
                  We retain personal information for as long as necessary to
                  provide the Services, comply with our legal obligations,
                  resolve disputes, and enforce our agreements. Specifically:
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Account information</strong> is retained for the
                    life of your account plus a reasonable period thereafter
                    (typically 24 months) to allow account reactivation and
                    resolve any post-termination matters.
                  </li>
                  <li>
                    <strong>Transaction records</strong> are retained for at
                    least seven (7) years to comply with tax, financial, and
                    consumer-protection requirements.
                  </li>
                  <li>
                    <strong>Age-verification records</strong> are retained by
                    our third-party verification provider in accordance with
                    their retention policies and applicable law.
                  </li>
                  <li>
                    <strong>Marketing-list data</strong> is retained until you
                    opt out, after which we maintain suppression-list
                    information indefinitely to honor your opt-out request.
                  </li>
                  <li>
                    <strong>Customer-support communications</strong> are
                    retained for up to three (3) years.
                  </li>
                  <li>
                    <strong>Website analytics data</strong> is retained in
                    identifiable form for up to 26 months.
                  </li>
                </ul>
                <p>
                  After these periods, we delete or de-identify personal
                  information unless retention is required or permitted by
                  law.
                </p>

                <h3 className="pp-policy-heading">Your Rights and Choices</h3>
                <p>
                  Depending on where you live, you may have some or all of the
                  rights listed below in relation to your personal information.
                  However, these rights are not absolute, may apply only in
                  certain circumstances, and, in certain cases, we may decline
                  your request as permitted by law.
                </p>
                <ul className="pp-policy-list">
                  <li>
                    <strong>Right to Access / Know.</strong> You may have a
                    right to request access to personal information that we
                    hold about you and to information about how we have
                    collected, used, and disclosed it.
                  </li>
                  <li>
                    <strong>Right to Delete.</strong> You may have a right to
                    request that we delete personal information we maintain
                    about you.
                  </li>
                  <li>
                    <strong>Right to Correct.</strong> You may have a right to
                    request that we correct inaccurate personal information we
                    maintain about you.
                  </li>
                  <li>
                    <strong>Right of Portability.</strong> You may have a
                    right to receive a copy of the personal information we
                    hold about you and to request that we transfer it to a
                    third party, in certain circumstances and with certain
                    exceptions.
                  </li>
                  <li>
                    <strong>Right to Opt Out of Sale or Sharing.</strong> You
                    may have a right to opt out of any sale or sharing of
                    personal information for cross-context behavioral
                    advertising. You can exercise this right by clicking{" "}
                    <strong>"Do Not Sell or Share My Personal Information"</strong>{" "}
                    in our website footer or by sending us your request using
                    the contact details below.
                  </li>
                  <li>
                    <strong>Right to Limit Use of Sensitive Personal Information.</strong>{" "}
                    Where applicable, you have the right to limit our use and
                    disclosure of sensitive personal information to the
                    purposes specified by law.
                  </li>
                  <li>
                    <strong>Managing Communication Preferences.</strong> We
                    may send you promotional emails, and you may opt out of
                    receiving these at any time by using the unsubscribe
                    option displayed in our emails to you. You may opt out of
                    marketing text messages by replying STOP. If you opt out,
                    we may still send you non-promotional emails, such as
                    those about your account or orders that you have made.
                  </li>
                </ul>
                <p>
                  You may exercise any of these rights by contacting us using
                  the contact details provided below. We will not discriminate
                  against you for exercising any of these rights. We may need
                  to verify your identity before we can process your requests,
                  as permitted or required under applicable law. In accordance
                  with applicable laws, you may designate an authorized agent
                  to make requests on your behalf to exercise your rights.
                  Before accepting such a request from an agent, we will
                  require that the agent provide proof you have authorized
                  them to act on your behalf, and we may need you to verify
                  your identity directly with us. We will respond to your
                  request in a timely manner as required under applicable law.
                </p>

                <h3 className="pp-policy-heading">State-Specific Privacy Disclosures</h3>
                <h4 className="pp-policy-subheading">California</h4>
                <p>
                  If you are a California resident, you have the rights set
                  forth above under the California Consumer Privacy Act, as
                  amended by the California Privacy Rights Act ("CCPA").
                  Specifically, you have the right to know what personal
                  information we collect, use, disclose, and "share"; the
                  right to delete; the right to correct; the right to opt out
                  of "sale" and "sharing"; and the right to limit our use of
                  sensitive personal information.
                </p>
                <p>
                  In the preceding 12 months, we have collected the categories
                  of personal information identified in the "Personal
                  Information We Collect or Process" section above, and
                  disclosed those categories to the categories of recipients
                  identified in the "How We Disclose Personal Information"
                  section. We have not "sold" personal information for
                  monetary consideration. We have "shared" the following
                  categories for cross-context behavioral advertising:
                  identifiers, internet/electronic network activity
                  information, and inferences.
                </p>
                <p>
                  You can exercise your rights by emailing us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  , calling{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>, or clicking{" "}
                  <strong>"Do Not Sell or Share My Personal Information"</strong>{" "}
                  in the footer of our website. We will respond within the
                  timeframes required by law.
                </p>
                <p>
                  If we deny your request, you have the right to appeal our
                  decision. To appeal, contact us at the email or phone number
                  above with the subject line "Privacy Request Appeal."
                </p>

                <h4 className="pp-policy-subheading">
                  Virginia, Colorado, Connecticut, Utah, Texas, Oregon, and Other States
                </h4>
                <p>
                  If you are a resident of Virginia, Colorado, Connecticut,
                  Utah, Texas, Oregon, Montana, Delaware, New Hampshire, New
                  Jersey, Iowa, or any other state with a comprehensive
                  consumer privacy law in effect, you may have additional
                  rights including the rights to access, correct, delete,
                  port, and opt out of targeted advertising and the sale of
                  personal data. You can exercise these rights using the same
                  methods listed above. We will respond within the timeframes
                  required by your state's law. If we deny your request, you
                  may have the right to appeal our decision by responding to
                  our denial with the subject line "Privacy Request Appeal."
                </p>

                <h4 className="pp-policy-subheading">Nevada</h4>
                <p>
                  If you are a Nevada resident, you have the right to direct
                  us not to make any sale of your covered personal
                  information, as defined under Nevada law. We do not sell
                  covered personal information as defined under Nevada law,
                  but you may submit a request by contacting us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>.
                </p>

                <h3 className="pp-policy-heading">International Transfers</h3>
                <p>
                  We are based in the United States. If you are accessing the
                  Services from outside the United States, your personal
                  information may be transferred to, stored, and processed in
                  the United States and other countries where our service
                  providers operate. By using the Services, you consent to the
                  transfer of your personal information to the United States.
                </p>
                <p>
                  If we transfer your personal information out of the European
                  Economic Area or the United Kingdom, we will rely on
                  recognized transfer mechanisms like the European Commission's
                  Standard Contractual Clauses, or any equivalent contracts
                  issued by the relevant competent authority of the UK, as
                  relevant, unless the data transfer is to a country that has
                  been determined to provide an adequate level of protection.
                </p>

                <h3 className="pp-policy-heading">Complaints</h3>
                <p>
                  If you have complaints about how we process your personal
                  information, please contact us using the contact details
                  provided below. Depending on where you live, you may have
                  the right to appeal our decision by contacting us, or lodge
                  your complaint with your local data protection authority.
                </p>

                <h3 className="pp-policy-heading">Changes to This Privacy Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time,
                  including to reflect changes to our practices or for other
                  operational, legal, or regulatory reasons. We will post the
                  revised Privacy Policy on this website, update the "Last
                  updated" date, and provide notice as required by applicable
                  law.
                </p>

                <h3 className="pp-policy-heading">Contact</h3>
                <p>
                  Should you have any questions about our privacy practices or
                  this Privacy Policy, or if you would like to exercise any of
                  the rights available to you, please call us at{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>, email us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  , or write to us at:
                </p>
                <p className="pp-policy-address">
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
