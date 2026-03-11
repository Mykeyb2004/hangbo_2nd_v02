import { HighlightCard } from "@/components/highlight-card";
import type { Highlight } from "@/lib/report-types";

type HighlightsGridProps = {
  highlights: Highlight[];
};

export function HighlightsGrid({ highlights }: HighlightsGridProps) {
  return (
    <div className="highlight-grid">
      {highlights.map((highlight) => (
        <HighlightCard key={highlight.label} highlight={highlight} />
      ))}
    </div>
  );
}
