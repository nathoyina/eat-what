import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./site";

export const homeFaqs = [
  {
    question: "How does Eat What pick a spot?",
    answer:
      "You choose a Singapore neighbourhood or use your location, then set meal, snack or drinks, cuisine, price and how far you will go. Eat What loads live places from Google Maps, puts a shortlist on a spin reel, and lands on one spot.",
  },
  {
    question: "Can I spin for snacks or drinks, not just dinner?",
    answer:
      "Yes. Kind is a required filter: Meal for restaurants and hawker food, Snack for dessert and bites, or Drinks for cafes, tea, coffee and bars. Then spin a nearby winner from Google Maps.",
  },
  {
    question: "Does it work for hawker centres and cafes?",
    answer:
      "Yes. Meal searches cover restaurants and hawker centres. Drinks covers cafes and bars. Snack covers dessert and bite spots. Results come from Google Places, so you get real nearby venues rather than a static list.",
  },
  {
    question: "Which Singapore areas can I search?",
    answer:
      "Eat What covers dozens of neighbourhoods across the island — from Tiong Bahru, Katong and Holland Village to Tampines, Jurong East and Woodlands — plus GPS search around where you are.",
  },
  {
    question: "Is Eat What free?",
    answer:
      "Yes. There is no account. Pick filters, spin, and open the winner in Google Maps. You can save favourites on this device.",
  },
] as const;

export function homeJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-SG",
        publisher: { "@id": `${siteUrl}/#app` },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Any",
        inLanguage: "en-SG",
        areaServed: {
          "@type": "Country",
          name: "Singapore",
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "SGD",
        },
        slogan: SITE_TAGLINE,
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        url: siteUrl,
        mainEntity: homeFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}
