import type { Metadata } from "next";
import "./globals.css";
import { CANONICAL_ORIGIN, MINIAPP_ORIGIN } from "@/lib/urls";

// The mini-app embed launches on the vercel.app domain (where the manifest is
// registered); everything else — og tags, share pages — is canonical.
const miniAppEmbed = {
  version: "1",
  imageUrl: `${MINIAPP_ORIGIN}/image.png`,
  button: {
    title: "Knit your sweater NFT!",
    action: {
      type: "launch_miniapp",
      name: "Onchain Fair Isle",
      url: MINIAPP_ORIGIN,
      splashImageUrl: `${MINIAPP_ORIGIN}/splash.png`,
      splashBackgroundColor: "#0a0a0a",
    },
  },
};

export const metadata: Metadata = {
  title: "Onchain Fair Isle",
  description: "Mint generative fair isle knitting pattern NFTs on Base",
  openGraph: {
    title: "Onchain Fair Isle",
    description: "Mint generative fair isle knitting pattern NFTs on Base",
    images: [`${CANONICAL_ORIGIN}/hero.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* No wallet providers here — they live in the (wallet) route group, so
          the collection and token pages ship none of that JavaScript. */}
      <body>{children}</body>
    </html>
  );
}
