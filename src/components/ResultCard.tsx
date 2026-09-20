"use client";

import {
  buildSharePayload,
  formatConfidenceLine,
  shareResult,
} from "@/lib/result-card";
import { placePhotoSrc } from "@/lib/place-photo";
import { googleMapsUrl } from "@/lib/restaurants";
import { reelPriceSymbols, type Restaurant } from "@/lib/types";
import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  restaurant: Restaurant;
  walkLabel?: string | null;
  saved: boolean;
  onSave: () => void;
  onSpinAgain: () => void;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5v16L12 16.5 6 20.5v-16Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5" />
      <path d="M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

function BowlIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-ink-muted"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5h16c0 4.2-3.1 8-8 8s-8-3.8-8-8Z" />
      <path d="M8 10.5c.4-2.4 1.8-4 4-4s3.6 1.6 4 4" />
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-ink-muted"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M9.8 10.2c.4-.8 1.2-1.2 2.2-1.2 1.2 0 2 .5 2 1.5s-.8 1.4-2.2 1.7c-1.4.3-2.3.8-2.3 1.9 0 1 .9 1.6 2.3 1.6 1.1 0 1.9-.4 2.3-1.2" />
    </svg>
  );
}

export function ResultCard({
  restaurant,
  walkLabel,
  saved,
  onSave,
  onSpinAgain,
}: Props) {
  const maps = googleMapsUrl(restaurant);
  const priceSymbol = reelPriceSymbols(restaurant.priceLevel);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const confidence = useMemo(
    () =>
      formatConfidenceLine({
        rating: restaurant.rating,
        walkLabel,
        openNow: restaurant.openNow,
      }),
    [restaurant.rating, restaurant.openNow, walkLabel],
  );

  const photoName = restaurant.photoName;
  const showPhoto = Boolean(photoName) && !photoFailed;

  const handleShare = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/` : "/";
    const payload = buildSharePayload({
      name: restaurant.name,
      line: confidence,
      url,
    });
    const outcome = await shareResult(payload);
    if (outcome === "copied") setShareStatus("Link copied");
    else if (outcome === "shared") setShareStatus("Shared");
    else if (outcome === "failed") setShareStatus("Couldn’t share");
    else setShareStatus(null);
  };

  return (
    <div className="animate-result-in space-y-5 rounded-3xl bg-white p-1 sm:p-2">
      <div className="space-y-2">
        <p className="text-sm text-ink-muted">Tonight’s makan</p>
        <h3 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          {restaurant.name}
        </h3>
        {confidence ? (
          <p className="text-sm text-ink-muted">{confidence}</p>
        ) : null}
      </div>

      {showPhoto && photoName ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-bg-soft">
          <Image
            src={placePhotoSrc(photoName)}
            alt={restaurant.name}
            fill
            unoptimized
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
            onError={() => setPhotoFailed(true)}
          />
        </div>
      ) : null}

      {restaurant.cuisine || priceSymbol ? (
        <div className="flex flex-wrap gap-2">
          {restaurant.cuisine ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm font-medium text-ink">
              <BowlIcon />
              {restaurant.cuisine}
            </span>
          ) : null}
          {priceSymbol ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm font-medium text-ink">
              <PriceIcon />
              {priceSymbol}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={saved}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 py-3.5 text-base font-bold text-ink transition hover:bg-bg-soft disabled:opacity-60"
        >
          <BookmarkIcon filled={saved} />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lime-quiet px-5 py-3.5 text-base font-bold text-ink transition hover:brightness-95"
        >
          <ShareIcon />
          Share
        </button>
      </div>

      <p className="text-center text-sm text-ink-muted">
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline-offset-2 hover:text-ink hover:underline"
        >
          Open in Maps
        </a>
      </p>
      {shareStatus ? (
        <p className="text-center text-xs text-ink-muted" role="status" aria-live="polite">
          {shareStatus}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSpinAgain}
        className="w-full text-sm font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
      >
        Spin again
      </button>
    </div>
  );
}
