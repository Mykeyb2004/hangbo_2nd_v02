import type { CSSProperties, ReactNode } from "react";

type QuestionCardShellProps = {
  title: string;
  description?: string;
  accent: string;
  filterTabs: ReactNode;
  children: ReactNode;
};

export function QuestionCardShell({
  title,
  description,
  accent,
  filterTabs,
  children,
}: QuestionCardShellProps) {
  const style = { ["--accent" as string]: accent } as CSSProperties;

  return (
    <article className="surface-card question-card" style={style}>
      <div className="question-head">
        <div className="question-heading">
          <div>
            <h3>{title}</h3>
          </div>
        </div>
        {description ? <p className="question-description">{description}</p> : null}
      </div>

      {filterTabs}
      {children}
    </article>
  );
}
