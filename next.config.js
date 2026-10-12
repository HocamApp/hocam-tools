/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * The whole app lives under /araclar. The main site proxies that one prefix
   * here with a rewrite, so Google sees hocamozelders.com/araclar/... on a
   * single domain. basePath also moves /_next/static under /araclar, which is
   * why that one rewrite carries the assets too and no assetPrefix is needed.
   */
  basePath: "/araclar",
  poweredByHeader: false,
  /* Retired tools (only live for a day): send old links to the combined tool. Temporary (307) on
     purpose, so nothing is cached as permanent if a tool comes back. basePath is added automatically. */
  async redirects() {
    return ["tyt-net-hesaplama", "ayt-net-hesaplama", "obp-hesaplama", "hedef-net-planlayici"].map((slug) => ({
      source: `/${slug}`,
      destination: "/yks-puan-siralama-hesaplama",
      permanent: false,
    }));
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
