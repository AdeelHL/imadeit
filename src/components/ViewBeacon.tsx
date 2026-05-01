"use client";

import { useEffect } from "react";

export function ViewBeacon({
  postId,
  enabled,
}: {
  postId: string;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const key = `viewed:${postId}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {
      // Silent: a failed view ping should never disrupt the page experience.
      // The DB-side dedup means retries are safe but unnecessary.
    });
  }, [postId, enabled]);

  return null;
}
