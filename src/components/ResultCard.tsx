"use client";

import { googleMapsUrl } from "@/lib/restaurants";
import { formatPriceLabel, type Restaurant } from "@/lib/types";

type Props = {
  restaurant: Restaurant;
  pun: string;
  areaLabel: string;
  saved: boolean;
  onSave: () => void;
  onSpinAgain: () => void;
};

export function ResultCard({
  restaurant,
  pun,
  areaLabel,
  saved,
  onSave,
  onSpinAgain,
}: Props) {
  const maps = googleMapsUrl(restaurant);
  const priceLabel = formatPriceLabel(
    restaurant.priceLevel,
    restaurant.priceRangeText,
  );

  return (
    <div className="animate-result-in space-y-4 rounded-3xl border border-border bg-bg-elevated p-5 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wider text-lime">
        Tonight’s makan
      </p>
      <h3 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
        {restaurant.name}
      </h3>
      <p className="text-base italic text-coral">&ldquo;{pun}&rdquo;</p>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        {priceLabel ? (
          <div>
            <dt className="text-ink-muted">Price</dt>
            <dd className="font-semibold">{priceLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-ink-muted">Cuisine</dt>
          <dd className="font-semibold">{restaurant.cuisine}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Area</dt>
          <dd className="font-semibold">{areaLabel}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Address</dt>
          <dd className="font-semibold leading-snug">{restaurant.address}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={saved}
          className="flex-1 rounded-xl bg-mint px-4 py-3 text-sm font-bold text-white transition enabled:hover:brightness-110 disabled:opacity-60"
        >
          {saved ? "Saved ✓" : "Save for later"}
        </button>
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl border border-border bg-bg-soft px-4 py-3 text-center text-sm font-bold text-lime transition hover:border-lime/40 hover:bg-lime/5"
        >
          Open in Google Maps
        </a>
      </div>
      <p className="text-center text-xs text-ink-muted">
        In Maps, tap Save / star to add it to your lists.
      </p>
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
