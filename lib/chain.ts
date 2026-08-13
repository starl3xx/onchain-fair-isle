// Server-side chain reads for the collection and token pages.
import { unstable_cache } from "next/cache";
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  http,
} from "viem";
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

// The default public RPC has no SLA and rate-limits under bursts, so one
// transport failure shouldn't become a user-visible error. Reverts are not
// retried — they are an answer, not a failure.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRevert =
        err instanceof BaseError && err.walk((e) => e instanceof ContractFunctionRevertedError);
      if (isRevert || i >= attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 150 * 2 ** i));
    }
  }
}

// JSON-RPC is POST, and Next's data cache only covers GET — so an unwrapped
// chain read marks the whole page uncacheable, which is why token pages were
// served `private, no-store` and re-rendered on every single request despite
// exporting `revalidate`. unstable_cache caches the call itself instead.
export const readTotalSupply = unstable_cache(
  async function readTotalSupply(): Promise<number> {
    const n = await withRetry(() =>
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: READ_ABI,
        functionName: "totalSupply",
      })
    );
    return Number(n);
  },
  ["fairisle-total-supply"],
  { revalidate: 300 }
);

export const readOwnerOf = unstable_cache(
  async function readOwnerOf(tokenId: number): Promise<`0x${string}` | null> {
  try {
    return await withRetry(() =>
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: READ_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      })
    );
  } catch (err) {
    // Only a revert means "no such token". Swallowing transport failures too
    // would turn an RPC outage into 404s for real tokens — and those 404s get
    // cached, so a blip would outlive itself. Anything else propagates.
    if (err instanceof BaseError && err.walk((e) => e instanceof ContractFunctionRevertedError)) {
      return null;
    }
    throw err;
  }
  },
  ["fairisle-owner-of"],
  { revalidate: 300 }
);
