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
export const SITE_TAGLINE = "Random restaurant picker for Singapore";
export const SITE_DESCRIPTION =
  "Can't decide what to eat in Singapore? Pick a neighbourhood, cuisine and budget, then spin a wheel of real Google Maps restaurants, cafes and hawker centres. No signup.";
