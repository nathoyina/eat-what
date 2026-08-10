import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * Nearby Search Pro free cap is 5,000/month.
 * We stay under that with a buffer. Override via PLACES_MONTHLY_CAP.
 */
export const PLACES_FREE_TIER_CAP = 5_000;
export const DEFAULT_MONTHLY_CAP = 4_500;

type QuotaFile = {
  month: string; // YYYY-MM
  used: number;
};

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function quotaDir() {
  // Vercel serverless only allows writes under /tmp
  if (process.env.VERCEL) {
    return path.join("/tmp", "eat-what-quota");
  }
  return path.join(process.cwd(), ".data");
}

function quotaPath() {
  return path.join(quotaDir(), "places-quota.json");
}

export function getMonthlyCap(): number {
  const raw = process.env.PLACES_MONTHLY_CAP;
  if (!raw) return DEFAULT_MONTHLY_CAP;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_MONTHLY_CAP;
  return Math.min(Math.floor(n), PLACES_FREE_TIER_CAP);
}

async function readQuota(): Promise<QuotaFile> {
  const month = monthKey();
  try {
    const raw = await readFile(quotaPath(), "utf8");
    const parsed = JSON.parse(raw) as QuotaFile;
    if (parsed.month === month && typeof parsed.used === "number") {
      return { month, used: Math.max(0, Math.floor(parsed.used)) };
    }
  } catch {
    // missing or corrupt → reset
  }
  return { month, used: 0 };
}

async function writeQuota(quota: QuotaFile) {
  const dir = path.dirname(quotaPath());
  await mkdir(dir, { recursive: true });
  await writeFile(quotaPath(), JSON.stringify(quota, null, 2), "utf8");
}

export type QuotaStatus = {
  month: string;
  used: number;
  cap: number;
  remaining: number;
  allowed: boolean;
};

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const quota = await readQuota();
  const cap = getMonthlyCap();
  const remaining = Math.max(0, cap - quota.used);
  return {
    month: quota.month,
    used: quota.used,
    cap,
    remaining,
    allowed: remaining > 0,
  };
}

/** Reserve `cost` calls. Returns updated status; does not increment if denied. */
export async function tryConsumeQuota(cost = 1): Promise<QuotaStatus> {
  const quota = await readQuota();
  const cap = getMonthlyCap();
  const nextUsed = quota.used + cost;
  if (nextUsed > cap) {
    return {
      month: quota.month,
      used: quota.used,
      cap,
      remaining: Math.max(0, cap - quota.used),
      allowed: false,
    };
  }
  const updated = { month: quota.month, used: nextUsed };
  await writeQuota(updated);
  return {
    month: updated.month,
    used: updated.used,
    cap,
    remaining: Math.max(0, cap - updated.used),
    allowed: true,
  };
}
