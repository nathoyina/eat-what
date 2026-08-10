"use client";

import { getBadge } from "@/lib/badges";
import type { BadgeId } from "@/lib/types";
import { useEffect } from "react";

type Props = {
  badgeIds: BadgeId[];
  onDismiss: () => void;
};

export function BadgeToast({ badgeIds, onDismiss }: Props) {
  useEffect(() => {
    if (badgeIds.length === 0) return;
    const t = window.setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [badgeIds, onDismiss]);

  if (badgeIds.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 space-y-2">
      {badgeIds.map((id) => {
        const badge = getBadge(id);
        return (
          <div
            key={id}
            className="animate-badge-pop flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3 shadow-lg"
            role="status"
          >
            <span className="text-2xl" aria-hidden>
              {badge.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-lime">
                Badge unlocked
              </p>
              <p className="truncate font-display text-lg font-bold">
                {badge.name}
              </p>
              <p className="text-xs text-ink-muted">{badge.description}</p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-ink-muted hover:text-ink"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
