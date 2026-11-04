"use client";

import { useCallback, useEffect, useState } from "react";
import { Collection, Workspace } from "@/lib/types";

type Action =
  | { action: "upsert"; collection: Collection; item: Record<string, unknown> }
  | { action: "delete"; collection: Collection; id: string }
  | { action: "complete" | "reopen"; id: string }
  | { action: "settings"; settings: Partial<Workspace["settings"]> };

export function useWorkspace(onUnauthorized: () => void) {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workspace")
      .then(async (r) => {
        if (r.status === 401) return onUnauthorized();
        if (!r.ok) throw new Error();
        setData(await r.json());
      })
      .catch(() =>
        setError("Berry couldn't load your data. Refresh to try again."),
      );
  }, [onUnauthorized]);

  /** Returns an error message, or null on success. */
  const send = useCallback(
    async (body: Action): Promise<string | null> => {
      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null);
      if (!r) return "You're offline — the change wasn't saved.";
      if (r.status === 401) {
        onUnauthorized();
        return "Your session ended. Sign in again.";
      }
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return json.error || "The change wasn't saved.";
      setData(json);
      return null;
    },
    [onUnauthorized],
  );

  return { data, error, send };
}

export type Send = ReturnType<typeof useWorkspace>["send"];
