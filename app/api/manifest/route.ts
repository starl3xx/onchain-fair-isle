import { NextResponse } from "next/server";
import { MINIAPP_ORIGIN } from "@/lib/urls";
import association from "@/lib/account-association.json";

// The mini-app manifest, self-hosted. The previous registration lived only in
// Farcaster's hosted-manifest service and silently died there ("Hosted
// miniapp manifest not found") — nothing in the repo held a copy. Serving it
// from the codebase means it is version-controlled and cannot vanish again.
//
// Served at /.well-known/farcaster.json via a basePath:false rewrite in
// next.config.js. Every URL uses MINIAPP_ORIGIN (the vercel.app domain):
// the accountAssociation signature binds to the domain serving this file.
//
// Field constraints (miniapps.farcaster.xyz/docs/guides/publishing):
// name ≤32 · subtitle ≤30 · description ≤170 · tagline/ogTitle ≤30 ·
// ogDescription ≤100 · tags ≤5×20 lowercase · icon 1024²·no alpha ·
// splash 200² · screenshots portrait 1284×2778 ≤3 · hero/og 1200×630.
export async function GET() {
  const { header, payload, signature } = association;

  const manifest = {
    ...(header && payload && signature
      ? { accountAssociation: { header, payload, signature } }
      : {}),
    miniapp: {
      version: "1",
      name: "Onchain Fair Isle",
      homeUrl: MINIAPP_ORIGIN,
      iconUrl: `${MINIAPP_ORIGIN}/OFI-icon.png`,
      splashImageUrl: `${MINIAPP_ORIGIN}/splash-200.png`,
      splashBackgroundColor: "#0a0a0a",
      // Copy is Jake's original December registration. Two deliberate edits
      // since: the URLs moved (basePath), and the dead webhookUrl was dropped
      // because no /api/webhook route exists here and declaring one falsely
      // advertises notification support. The count is twelve — eleven standard
      // colourways plus the rare Nordic Rainbow, which the renderer exports as
      // the twelfth entry in PALETTES; it read 11 until 2026-08-13.
      subtitle: "Generative NFT collection",
      description:
        "Fair Isle-inspired generative NFT collection on Base with 12 color palettes, countless patterns, and unlimited delight",
      screenshotUrls: [
        `${MINIAPP_ORIGIN}/screenshots/1-mint.png`,
        `${MINIAPP_ORIGIN}/screenshots/2-collection.png`,
        `${MINIAPP_ORIGIN}/screenshots/3-token.png`,
      ],
      primaryCategory: "art-creativity",
      tags: ["nft", "art", "generative", "holiday", "base"],
      heroImageUrl: `${MINIAPP_ORIGIN}/hero.png`,
      tagline: "Knit your Fair Isle sweater",
      ogTitle: "Onchain Fair Isle | Mint Now",
      ogDescription: "Generative Fair Isle-inspired NFT collection on Base",
      ogImageUrl: `${MINIAPP_ORIGIN}/hero.png`,
      requiredChains: ["eip155:8453"],
      requiredCapabilities: [
        "actions.ready",
        "actions.composeCast",
        "wallet.getEthereumProvider",
      ],
    },
  };

  return NextResponse.json(manifest, {
    headers: { "Cache-Control": "public, max-age=300, must-revalidate" },
  });
}
