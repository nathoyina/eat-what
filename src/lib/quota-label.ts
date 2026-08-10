export type QuotaInfo = {
  used: number;
  cap: number;
  remaining: number;
  month?: string;
};

/** e.g. "2026-08" → "1 Sep" (UTC, first day of next month) */
function nextResetLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return "";
  const next = new Date(Date.UTC(year, month, 1));
  return next.toLocaleDateString("en-SG", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Human-readable monthly quota line for the UI */
export function formatQuotaLabel(quota: QuotaInfo): string {
  const reset = quota.month ? nextResetLabel(quota.month) : "";
  const resetSuffix = reset ? ` · resets ${reset}` : "";
  return `${quota.remaining}/${quota.cap} free API calls left this month${resetSuffix}`;
}
