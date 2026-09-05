import { HomeApp } from "@/components/HomeApp";
import { HomeSeo } from "@/components/HomeSeo";
import { homeJsonLd } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

export default function HomePage() {
  const jsonLd = homeJsonLd(getSiteUrl());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeApp />
      <HomeSeo />
    </>
  );
}
