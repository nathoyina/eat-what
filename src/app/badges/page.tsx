"use client";

import { BADGES } from "@/lib/badges";
import { useBadgeProgress } from "@/lib/hooks";
import Link from "next/link";

export default function BadgesPage() {
  const progress = useBadgeProgress();
  const unlocked = progress.unlocked;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-20">
      <h1 className="font-display text-3xl font-bold text-ink">Badges</h1>
      <p className="mt-2 text-ink-muted">
        Collect them as you spin, explore cuisines, and save spots.
      </p>
      <p className="mt-3 text-sm text-mint">
        {unlocked.length}/{BADGES.length} unlocked · {progress.totalSpins}{" "}
        spins · {progress.savedCount} saved
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {BADGES.map((badge) => {
          const got = unlocked.includes(badge.id);
          return (
            <li
              key={badge.id}
              className={`rounded-2xl border p-4 transition ${
                got
                  ? "border-lime/30 bg-lime/5"
                  : "border-border bg-bg-soft opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  {badge.icon}
                </span>
                <div>
                  <p className="font-display text-lg font-bold">{badge.name}</p>
                  <p className="text-sm text-ink-muted">{badge.description}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-lime">
                    {got ? "Unlocked" : "Locked"}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/"
        className="mt-10 inline-block text-sm font-bold text-ink-muted hover:text-lime"
      >
        ← Back to spin
      </Link>
    </div>
  );
}
