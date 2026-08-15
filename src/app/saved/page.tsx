"use client";

import { googleMapsUrl } from "@/lib/restaurants";
import { useSavedSpots } from "@/lib/hooks";
import { removeSaved } from "@/lib/storage";
import { VENUE_LABELS } from "@/lib/types";
import Link from "next/link";

export default function SavedPage() {
  const spots = useSavedSpots();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-20">
      <h1 className="font-display text-3xl font-bold text-ink">Saved</h1>
      <p className="mt-2 text-ink-muted">
        Your shortlist — open any spot in Google Maps to star it on your
        account.
      </p>

      {spots.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-bg-soft px-5 py-10 text-center">
          <p className="font-semibold">No saves yet.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Spin, land on a winner, then tap Save for later.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-white"
          >
            Go spin
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {spots.map((spot) => (
            <li
              key={spot.id}
              className="rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">{spot.name}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {spot.venueType
                      ? `${VENUE_LABELS[spot.venueType]} · `
                      : ""}
                    {spot.cuisine} · {spot.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSaved(spot.id)}
                  className="shrink-0 text-xs font-semibold text-ink-muted hover:text-coral"
                >
                  Remove
                </button>
              </div>
              <a
                href={googleMapsUrl(spot)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-bold text-lime hover:underline"
              >
                Open in Google Maps →
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
