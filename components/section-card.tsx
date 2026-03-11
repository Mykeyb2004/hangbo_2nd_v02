import type { ReactNode } from "react";

import type { Section } from "@/lib/report-types";

type SectionCardProps = {
  section: Section;
  children: ReactNode;
};

export function SectionCard({ section, children }: SectionCardProps) {
  return (
    <section className="surface-card section-card" id={section.id}>
      <div className="section-head">
        <div className="section-title-row">
          <span className="section-index">{`${section.indexLabel}、`}</span>
          <h2>{section.title}</h2>
        </div>
        {section.description ? <p className="section-description">{section.description}</p> : null}
      </div>

      <div className="stack-lg">{children}</div>
    </section>
  );
}
