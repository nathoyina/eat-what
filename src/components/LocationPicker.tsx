"use client";

import { areas } from "@/lib/restaurants";
import { nearestArea } from "@/lib/geo";
import { quietChipIdle, quietChipSelected } from "@/lib/quiet-ui";
import { loadRecentAreas, rememberArea } from "@/lib/storage";
import type { LocationMode } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  location: LocationMode;
  onChange: (loc: LocationMode) => void;
};

export function LocationPicker({ location, onChange }: Props) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [recentAreaIds, setRecentAreaIds] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setRecentAreaIds(loadRecentAreas()));
  }, []);

  const recentAreas = recentAreaIds.flatMap((id) => {
    const area = areas.find((candidate) => candidate.id === id);
    return area ? [area] : [];
  });
  const recentIds = new Set(recentAreas.map((area) => area.id));
  const remainingAreas = areas.filter((area) => !recentIds.has(area.id));
  const selectedArea =
    location.type === "area"
      ? areas.find((area) => area.id === location.areaId)
      : null;

  const pickArea = (areaId: string) => {
    setRecentAreaIds(rememberArea(areaId));
    onChange({ type: "area", areaId });
  };

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
    <section className="space-y-4 bg-white">
      <div>
        <h2 className="text-lg font-semibold text-ink">Where are you?</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Near you, or pick a neighbourhood.
        </p>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={geoLoading}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
          location.type === "geo"
            ? "border-ink bg-ink text-white"
            : "border-border bg-white hover:border-ink/30"
        }`}
      >
        <span className="block text-sm font-bold">
          {geoLoading ? "Finding you…" : "Use my location"}
        </span>
        <span
          className={`mt-0.5 block text-xs ${
            location.type === "geo" ? "text-white/80" : "text-ink-muted"
          }`}
        >
          {nearest ? `Around ${nearest.name}` : "Search around you"}
        </span>
      </button>

      {geoError && (
        <p className="text-sm text-ink-muted">{geoError}</p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Area</p>
        {recentAreas.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {recentAreas.map((area) => {
              const selected =
                location.type === "area" && location.areaId === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => pickArea(area.id)}
                  className={selected ? quietChipSelected : quietChipIdle}
                >
                  {area.name}
                </button>
              );
            })}
          </div>
        )}
        <label htmlFor="area-select" className="sr-only">
          Choose a Singapore area
        </label>
        <select
          id="area-select"
          value={selectedArea?.id ?? ""}
          onChange={(event) => {
            if (event.target.value) pickArea(event.target.value);
          }}
          className="w-full rounded-full border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
        >
          <option value="">
            {selectedArea
              ? "Choose another area…"
              : `Choose from ${remainingAreas.length} areas…`}
          </option>
          {selectedArea ? (
            <option value={selectedArea.id}>{selectedArea.name}</option>
          ) : null}
          {remainingAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
