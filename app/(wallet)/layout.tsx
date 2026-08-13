import { Providers } from "../providers";

/**
 * Wallet-only shell. wagmi, viem, react-query and the Farcaster SDK add up to
 * ~129 KB gzipped, and only the mint flow ever calls them — so they load here
 * rather than in the root layout, where /collection and /token/[id] were
 * paying for a wallet stack they never touch.
 */
export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
