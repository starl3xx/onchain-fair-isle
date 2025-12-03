import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://onchain-fair-isle.vercel.app";

const miniAppEmbed = {
  version: "1",
  imageUrl: `${baseUrl}/image.png`,
  button: {
    title: "Knit your sweater",
    action: {
      type: "launch_miniapp",
      name: "Onchain Fair Isle",
      url: baseUrl,
      splashImageUrl: `${baseUrl}/splash.png`,
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
    images: ["/hero.png"],
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
