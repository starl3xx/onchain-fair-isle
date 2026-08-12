// Where things live, in one place.
//
// CANONICAL_ORIGIN — the public home of the collection: NFT metadata, token
// pages, share images, og tags. This is starl3xx.fun/fairisle, proxied by the
// starl3xx.fun Worker to this app. Moving the metadata's links off the shared
// *.vercel.app host is the fix for the OpenSea delisting (their heuristic
// flagged "a harmful link"; the only links in the metadata were vercel.app).
//
// MINIAPP_ORIGIN — where the Farcaster Mini App is hosted and (re-)registered.
// This deliberately stays on the vercel.app domain: a domain gets exactly one
// mini-app manifest, and starl3xx.fun's slot shouldn't be spent here. Embed
// launch URLs must match the manifest's domain, so they use this origin.
//
// Deliberately not env vars: this app has exactly one home, and a stale
// NEXT_PUBLIC_BASE_URL on the Vercel project must not silently win.
export const BASE_PATH = "/fairisle";
export const CANONICAL_ORIGIN = `https://starl3xx.fun${BASE_PATH}`;
export const MINIAPP_ORIGIN = `https://onchain-fair-isle.vercel.app${BASE_PATH}`;
