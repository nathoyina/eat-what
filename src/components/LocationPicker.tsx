"use client";

import { areas } from "@/lib/restaurants";
import { nearestArea } from "@/lib/geo";
import type { LocationMode } from "@/lib/types";
import { useState } from "react";

type Props = {
  location: LocationMode;
  onChange: (loc: LocationMode) => void;
};

export function LocationPicker({ location, onChange }: Props) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const useMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn’t supported here.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        onChange({
          type: "geo",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError("Couldn’t get your location. Pick an area instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const nearest =
    location.type === "geo"
      ? nearestArea(location.lat, location.lng, areas)
      : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          Eh, where you at?
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Near you or pick a neighbourhood — then we fill the wheel.
        </p>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={geoLoading}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
          location.type === "geo"
            ? "border-lime bg-lime/5"
            : "border-border bg-bg-elevated hover:border-lime/40"
        }`}
      >
        <span className="block text-sm font-bold text-lime">
          {geoLoading ? "Finding you…" : "Use my location"}
        </span>
        <span className="mt-0.5 block text-xs text-ink-muted">
          {nearest
            ? `Searching near you · around ${nearest.name}`
            : "We’ll pull makan within your reach"}
        </span>
      </button>

      {geoError && (
        <p className="text-sm text-coral">{geoError}</p>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Or pick an area
        </p>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => {
            const selected =
              location.type === "area" && location.areaId === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => onChange({ type: "area", areaId: area.id })}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  selected
                    ? "bg-lime text-white"
                    : "border border-border bg-bg-soft text-ink-muted hover:border-lime/30 hover:text-ink"
                }`}
              >
                {area.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
