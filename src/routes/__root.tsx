import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import sunriseCss from "../styles/sunrise-shell.css?url";
import { useCartSync } from "../hooks/useCartSync";
import { AgeGate } from "../components/AgeGate";
import { SpinWheel } from "../components/SpinWheel";
import { AnnouncementBar } from "../components/AnnouncementBar";

const GTM_ID = "GTM-M7W7CDK2";
const GTM_HEAD_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

// Cross-domain Facebook identity restore. Visitors arriving from srbev.com carry
// the click ID (fbc) and browser ID (fbp) as URL params on the "Yes" click-through
// (srbev and savorsunrise are different root domains, so the pixel cookies can't
// carry on their own). This runs BEFORE the GTM/pixel loader below, writing _fbc
// and _fbp to root-scoped cookies (.savorsunrise.com, so they reach the shop
// subdomain too) so the shared pixel (2142042653011938) initializes with the same
// identity. Values are strictly format-validated (no cookie injection), then the
// params are stripped from the URL. No-op when the params are absent.
const FB_RESTORE_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search),c=q.get('fbc'),p=q.get('fbp');if(!c&&!p)return;var o='; path=/; domain=.savorsunrise.com; max-age=7776000; SameSite=Lax; Secure';if(c&&c.length<=256&&/^fb\\.\\d\\.\\d+\\.[A-Za-z0-9_.-]+$/.test(c))document.cookie='_fbc='+c+o;if(p&&p.length<=256&&/^fb\\.\\d\\.\\d+\\.\\d+$/.test(p))document.cookie='_fbp='+p+o;q.delete('fbc');q.delete('fbp');var s=q.toString();history.replaceState({},'',location.pathname+(s?'?'+s:'')+location.hash);}catch(e){}})();`;

// Sitewide Organization JSON-LD (schema.org). Minimal, factual fields only —
// no postal address (the only address on file is the BIAB production entity,
// which never appears consumer-facing), no logo yet; sameAs lists the claimed
// Instagram profile (add more as they're confirmed). `<` is escaped so
// the JSON can't break out of the inline <script> tag.
const ORG_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SUNRISE Beverage",
  url: "https://www.savorsunrise.com",
  email: "hello@savorsunrise.com",
  telephone: "+1-877-674-7459",
  sameAs: ["https://www.instagram.com/savorsunrise"],
}).replace(/</g, "\\u003c");

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SUNRISE · Hemp-Infused Seltzer" },
      { name: "description", content: "SUNRISE hemp-infused seltzer. Simple ingredients, pure cane sugar, federally-legal Delta-9 THC across 10mg, 30mg, and 60mg potency tiers." },
      { name: "author", content: "SUNRISE Beverage" },
      { property: "og:site_name", content: "SUNRISE Beverage" },
      { property: "og:title", content: "SUNRISE · Hemp-Infused Seltzer" },
      { property: "og:description", content: "SUNRISE hemp-infused seltzer. Simple ingredients, pure cane sugar, federally-legal Delta-9 THC across 10mg, 30mg, and 60mg potency tiers." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.savorsunrise.com/og/SUNRISE_OG_Default_v1.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: sunriseCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: FB_RESTORE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: GTM_HEAD_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ORG_JSON_LD }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useCartSync();
  return (
    <>
      <AnnouncementBar />
      <Outlet />
      <AgeGate />
      <SpinWheel />
    </>
  );
}
