"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

export interface NeynarUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: string[];
}

async function fetchNeynarUser(fid: number): Promise<NeynarUser> {
  const response = await fetch(`/api/neynar/user?fid=${fid}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
}

export function useNeynarUser() {
  const [fid, setFid] = useState<number | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  // Get FID from Farcaster Frame SDK context
  useEffect(() => {
    const getFid = async () => {
      try {
        const context = await sdk.context;
        if (context?.user?.fid) {
          setFid(context.user.fid);
        }
      } catch (error) {
        console.error("Failed to get Farcaster context:", error);
      } finally {
        setIsLoadingContext(false);
      }
    };
    getFid();
  }, []);

  const {
    data: user,
    isLoading: isLoadingUser,
    error,
    refetch,
  } = useQuery({
    queryKey: ["neynar-user", fid],
    queryFn: () => fetchNeynarUser(fid!),
    enabled: !!fid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    user,
    fid,
    isLoading: isLoadingContext || (!!fid && isLoadingUser),
    error: error as Error | null,
    refetch,
  };
}
