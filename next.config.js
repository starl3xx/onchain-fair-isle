/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app's public home is starl3xx.fun/fairisle (the starl3xx.fun Worker
  // proxies /fairisle/* here). basePath makes every route and asset live under
  // /fairisle on this deployment too, so the proxy needs no path rewriting.
  basePath: "/fairisle",
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async redirects() {
    return [
      // Old links and cast embeds point at the domain root; send them to the
      // app's new basePath home. basePath:false so the source matches at "/".
      {
        source: "/",
        destination: "/fairisle",
        permanent: false,
        basePath: false,
      },
      // The mini-app manifest must stay at the domain root. NOTE: the hosted
      // manifest this points at currently 404s at Farcaster ("Hosted miniapp
      // manifest not found") — the registration needs to be redone from the
      // Farcaster developer tools, which only the account owner can sign.
      {
        source: "/.well-known/farcaster.json",
        destination:
          "https://api.farcaster.xyz/miniapps/hosted-manifest/019ae2d4-2c37-09ba-db87-6614196d33f0",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

module.exports = nextConfig;
