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
export const SITE_TAGLINE = "Random picker for meals, snacks and drinks in Singapore";
export const SITE_DESCRIPTION =
  "Can't decide what to eat or drink in Singapore? Pick a neighbourhood, then meal, snack or drinks, cuisine and budget. Spin a wheel of real Google Maps restaurants, cafes, hawker centres and bars. No signup.";

export const GOOGLE_SITE_VERIFICATION =
  "IzdMZ9miU8FomY3lO1lqvB-IKB2nbRW_gXt7PDxzQgg";
