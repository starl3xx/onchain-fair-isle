import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_API_URL = "https://api.neynar.com/v2";

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

export async function GET(request: NextRequest) {
  if (!NEYNAR_API_KEY) {
    return NextResponse.json(
      { error: "Neynar API key not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get("fid");
  const address = searchParams.get("address");

  if (!fid && !address) {
    return NextResponse.json(
      { error: "Either fid or address parameter is required" },
      { status: 400 }
    );
  }

  try {
    let user: NeynarUser | null = null;

    if (fid) {
      // Fetch user by FID
      const response = await fetch(
        `${NEYNAR_API_URL}/farcaster/user/bulk?fids=${fid}`,
        {
          headers: {
            accept: "application/json",
            api_key: NEYNAR_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`);
      }

      const data = await response.json();
      user = data.users?.[0] || null;
    } else if (address) {
      // Fetch user by verified Ethereum address
      const response = await fetch(
        `${NEYNAR_API_URL}/farcaster/user/bulk-by-address?addresses=${address.toLowerCase()}`,
        {
          headers: {
            accept: "application/json",
            api_key: NEYNAR_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`);
      }

      const data = await response.json();
      // The API returns a map of addresses to user arrays
      const users = data[address.toLowerCase()];
      user = users?.[0] || null;
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || "",
      followerCount: user.follower_count,
      followingCount: user.following_count,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
    });
  } catch (error) {
    console.error("Neynar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
