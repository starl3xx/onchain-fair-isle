import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionId = body.untrustedData?.transactionId;

    // Generate a new random preview for "Mint Another"
    const seed = Math.floor(Math.random() * 2147483647);

    // Return success frame
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${BASE_URL}/api/preview?seed=${seed}&success=true" />
  <meta property="fc:frame:button:1" content="Mint Another" />
  <meta property="fc:frame:button:1:action" content="tx" />
  <meta property="fc:frame:button:1:target" content="${BASE_URL}/api/frame" />
  <meta property="fc:frame:button:2" content="View on BaseScan" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="https://basescan.org/tx/${transactionId}" />
  <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/success" />
</head>
<body>
  <h1>Minted!</h1>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error handling success:", error);
    return NextResponse.json(
      { error: "Failed to handle success" },
      { status: 500 }
    );
  }
}
