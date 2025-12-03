"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import { base } from "wagmi/chains";
import sdk from "@farcaster/frame-sdk";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const MINT_PRICE = "0.002";

const CONTRACT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface MintButtonProps {
  onMintStart?: () => void;
  onMintSuccess?: (tokenId: bigint, txHash: string) => void;
  onMintError?: (error: Error) => void;
}

export function MintButton({
  onMintStart,
  onMintSuccess,
  onMintError,
}: MintButtonProps) {
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if running in Farcaster Frame context
  useEffect(() => {
    const initFrame = async () => {
      try {
        const context = await sdk.context;
        setIsFarcasterContext(!!context);
        if (context) {
          sdk.actions.ready();
        }
      } catch {
        setIsFarcasterContext(false);
      }
      setIsReady(true);
    };
    initFrame();
  }, []);

  // Handle successful mint
  useEffect(() => {
    if (isConfirmed && receipt && hash) {
      // Extract tokenId from Transfer event
      const transferLog = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      );
      const tokenId = transferLog
        ? BigInt(transferLog.topics[3] || "0")
        : BigInt(0);
      onMintSuccess?.(tokenId, hash);
    }
  }, [isConfirmed, receipt, hash, onMintSuccess]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      onMintError?.(writeError);
    }
  }, [writeError, onMintError]);

  const handleConnect = useCallback(async () => {
    // Try Farcaster Frame connector first
    const frameConnector = connectors.find(
      (c) => c.id === "farcasterFrame"
    );
    if (frameConnector) {
      connect({ connector: frameConnector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  const handleMint = useCallback(async () => {
    if (!isConnected) {
      await handleConnect();
      return;
    }

    // Switch to Base if needed
    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id });
      } catch (e) {
        onMintError?.(new Error("Please switch to Base network"));
        return;
      }
    }

    onMintStart?.();

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mint",
        value: parseEther(MINT_PRICE),
      });
    } catch (e) {
      onMintError?.(e as Error);
    }
  }, [
    isConnected,
    chainId,
    handleConnect,
    switchChain,
    writeContract,
    onMintStart,
    onMintError,
  ]);

  const isLoading = isWritePending || isConfirming;

  const buttonText = !isReady
    ? "Loading..."
    : !isConnected
    ? "Connect Wallet"
    : isWritePending
    ? "Confirm in Wallet..."
    : isConfirming
    ? "Knitting..."
    : `Knit for ${MINT_PRICE} ETH`;

  return (
    <button
      onClick={handleMint}
      disabled={isLoading || !isReady}
      style={{
        width: "100%",
        padding: "1rem",
        fontSize: "1.125rem",
        fontWeight: 600,
        border: "none",
        borderRadius: 12,
        background: isLoading
          ? "#333"
          : "linear-gradient(135deg, #5b9bd5, #2d5a8b)",
        color: "white",
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "transform 0.1s, opacity 0.1s",
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading && (
        <span
          style={{
            display: "inline-block",
            marginRight: "0.5rem",
          }}
          className="spin"
        >
          &#9696;
        </span>
      )}
      {buttonText}
    </button>
  );
}
