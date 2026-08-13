"use client";

import { useEffect } from "react";

/**
 * Dismisses the mini app splash screen on pages that can be launched directly —
 * a shared token card opens straight into /token/N, and without this the host
 * would sit on the splash forever.
 *
 * The SDK is imported lazily and only once we know we are inside an embedding
 * host. A mini app always runs in an iframe or a React Native WebView, and a
 * plain browser tab never does, so ordinary web visitors — most of the traffic
 * to these shareable pages — never download the ~66KB SDK at all. That keeps
 * the wallet-free page weight that the (wallet) route group exists to protect.
 */
export function MiniAppReady() {
  useEffect(() => {
    const embedded =
      window.parent !== window ||
      Boolean((window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView);
    if (!embedded) return;

    let cancelled = false;
    import("@farcaster/miniapp-sdk")
      .then((mod) => {
        const sdk = mod.sdk ?? mod.default;
        if (!cancelled) return sdk?.actions?.ready();
      })
      .catch(() => {
        // Nothing useful to do: outside a host there is no splash to dismiss.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
