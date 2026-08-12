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
      // The mini-app manifest must serve from the domain root. Self-hosted
      // now: the previous registration lived only in Farcaster's hosted-
      // manifest service and silently died there. A same-origin 307 (the
      // pattern Farcaster's own docs use) — a basePath:false *rewrite* to an
      // internal path is rejected by Next as an invalid external rewrite.
      {
        source: "/.well-known/farcaster.json",
        destination: "/fairisle/api/manifest",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

module.exports = nextConfig;
