export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  }

  return "http://localhost:3000";
}

export const SITE_NAME = "Eat What";
export const SITE_TAGLINE = "What to eat, snack or drink in Singapore";
export const SITE_DESCRIPTION =
  "Can't decide what to makan? Pick a Singapore area, filter meal/snack/drinks, then spin one real Google Maps spot — hawkers to cafes. Free, no signup.";

export const GOOGLE_SITE_VERIFICATION = [
  "cW9XyoU8kb799fMqDP53r70TNpe6YWk0SDTsTaTvauA",
  "IzdMZ9miU8FomY3lO1lqvB-IKB2nbRW_gXt7PDxzQgg",
] as const;
