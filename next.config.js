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
