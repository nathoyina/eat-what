/** Server-only Places key. Never import this module from client components. */
export function getPlacesApiKey(): string | undefined {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}
