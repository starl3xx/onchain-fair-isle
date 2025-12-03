import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Fair Isle NFT",
  description: "Mint generative fair isle knitting pattern NFTs on Base",
  openGraph: {
    title: "Fair Isle NFT",
    description: "Mint generative fair isle knitting pattern NFTs on Base",
    images: ["/preview.png"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_BASE_URL}/api/preview`,
    "fc:frame:button:1": "Mint Fair Isle",
    "fc:frame:button:1:action": "tx",
    "fc:frame:button:1:target": `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
    "fc:frame:post_url": `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/success`,
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
