import { areas } from "@/lib/restaurants";
import { homeFaqs } from "@/lib/seo";

export function HomeSeo() {
  return (
    <div className="border-t border-border bg-bg-soft">
      <div className="mx-auto max-w-3xl space-y-14 px-5 py-16 md:px-8">
        <section aria-labelledby="how-it-works-heading">
          <h2
            id="how-it-works-heading"
            className="font-display text-2xl font-bold text-ink"
          >
            How the Singapore restaurant spinner works
          </h2>
          <ol className="mt-6 space-y-5">
            <li>
              <h3 className="font-display text-lg font-semibold text-ink">
                1. Pick where you are eating
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Choose a neighbourhood or share your location. We search live
                Google Maps places around that point — restaurants, cafes or
                hawker centres.
              </p>
            </li>
            <li>
              <h3 className="font-display text-lg font-semibold text-ink">
                2. Filter kind, cuisine and budget
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Choose a meal, a snack or drinks, then narrow cuisine and price
                from hawker-cheap to a proper sit-down. Set walking distance or
                a wider reach.
              </p>
            </li>
            <li>
              <h3 className="font-display text-lg font-semibold text-ink">
                3. Spin once and go
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                A reel of real nearby spots stops on one winner. Open it in
                Google Maps, save it for later, or spin again if the table
                vetoes.
              </p>
            </li>
          </ol>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-2xl font-bold text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-6">
            {homeFaqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-display text-lg font-semibold text-ink">
                  {faq.question}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="areas-heading">
          <h2
            id="areas-heading"
            className="font-display text-2xl font-bold text-ink"
          >
            Neighbourhoods we search in Singapore
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Spin dinner in {areas.length} areas, including:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {areas.map((area) => (
              <li
                key={area.id}
                className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-semibold text-ink"
              >
                {area.name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
