"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const IDLE_MS = 30 * 60 * 1000;
const ACTIVITY_DEBOUNCE_MS = 20_000;

/**
 * Sliding session : chaque activité utilisateur rappelle getSession
 * (Better Auth étend expiresIn via updateAge). AFK 30 min → logout.
 */
export function SessionKeepalive() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const lastActivity = useRef(Date.now());
  const lastPing = useRef(0);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    function onActivity() {
      lastActivity.current = Date.now();
      const now = Date.now();
      if (now - lastPing.current < ACTIVITY_DEBOUNCE_MS) return;
      lastPing.current = now;
      void authClient.getSession();
    }

    const evts = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;
    for (const e of evts) {
      window.addEventListener(e, onActivity, { passive: true });
    }

    const tick = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= IDLE_MS) {
        void authClient.signOut().then(() => router.replace("/login"));
      }
    }, 30_000);

    void authClient.getSession();

    return () => {
      for (const e of evts) window.removeEventListener(e, onActivity);
      window.clearInterval(tick);
    };
  }, [router]);

  return null;
}
