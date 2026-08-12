// Server-side chain reads for the collection and token pages.
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// The deployed FairIsleNFT on Base mainnet. The env var wins when set (it is
// on Vercel); the literal keeps local dev and any misconfigured environment
// reading the real collection rather than silently rendering nothing.
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x99eC83c41DFfCA01Ea834Cd949b84574eF76fB6C") as `0x${string}`;

export const READ_ABI = [
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

export async function readTotalSupply(): Promise<number> {
  const n = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: READ_ABI,
    functionName: "totalSupply",
  });
  return Number(n);
}

export async function readOwnerOf(tokenId: number): Promise<`0x${string}` | null> {
  try {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: READ_ABI,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });
  } catch {
    // ownerOf reverts for nonexistent tokens
    return null;
  }
}
