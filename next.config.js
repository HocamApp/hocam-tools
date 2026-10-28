/** @type {import('next').NextConfig} */
/*
 * Cloudflare build (WORKERS_CI_BRANCH is set only there): every page is static,
 * so the app is exported to plain files and served as Workers static assets,
 * with no Worker code. The Vercel build is unchanged. redirects() and headers()
 * below do not apply to an export; scripts/build-workers-assets.mjs writes the
 * same rules to _redirects and _headers instead.
 */
const isWorkersBuild = Boolean(process.env.WORKERS_CI_BRANCH);

const nextConfig = {
  ...(isWorkersBuild ? { output: "export" } : {}),
  /*
   * The whole app lives under /araclar. The main site proxies that one prefix
   * here with a rewrite, so Google sees hocamozelders.com/araclar/... on a
   * single domain. basePath also moves /_next/static under /araclar, which is
   * why that one rewrite carries the assets too and no assetPrefix is needed.
   */
  basePath: "/araclar",
  poweredByHeader: false,
  /* Retired tools (each only live for about a day): send old links to the combined YKS tool, or to the hub for
     KPSS. Temporary (307) on purpose, so nothing is cached as permanent if a tool comes back. basePath is added
     automatically. */
  async redirects() {
    const toYks = ["tyt-net-hesaplama", "ayt-net-hesaplama", "obp-hesaplama", "hedef-net-planlayici"].map((slug) => ({
      source: `/${slug}`,
      destination: "/yks-puan-siralama-hesaplama",
      permanent: false,
    }));
    return [...toYks, { source: "/kpss-puan-hesaplama", destination: "/", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
