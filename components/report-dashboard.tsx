import { QuestionBlock } from "@/components/question-block";
import { buildHeroTitleLayout, formatGeneratedAt } from "@/lib/report-helpers";
import type { ReportData } from "@/lib/report-types";

type ReportDashboardProps = {
  data: ReportData;
};

export function ReportDashboard({ data }: ReportDashboardProps) {
  const heroTitle = buildHeroTitleLayout(data.meta.title);

  return (
    <main className="report-shell">
      <div className="report-orb report-orb-one" />
      <div className="report-orb report-orb-two" />

      <section className="hero-card">
        <div className="hero-text">
          <span className="hero-kicker">Survey Analytics · Next.js</span>
          <h1 className="hero-title">
            {heroTitle.lines.map((line, index) => (
              <span className="hero-title-line" key={line}>
                {line}
                {index === 0 && heroTitle.tag ? (
                  <em className="hero-title-tag">{heroTitle.tag}</em>
                ) : null}
              </span>
            ))}
          </h1>
          {data.meta.subtitle ? <p>{data.meta.subtitle}</p> : null}
          <div className="hero-meta">
            <span>样本总量 {data.meta.responseCount}</span>
            <span>客群页签 {data.meta.filters.length}</span>
            <span>生成时间 {formatGeneratedAt(data.meta.generatedAt)}</span>
          </div>
        </div>

        <div className="highlight-grid">
          {data.highlights.map((highlight) => (
            <article className="highlight-card" key={highlight.label}>
              <span>{highlight.label}</span>
              <strong>{highlight.value}</strong>
              <small>{highlight.detail}</small>
            </article>
          ))}
        </div>

        <div className="hero-footer">
          <div className="audience-strip">
            {data.meta.filters.map((filter) => (
              <span className="audience-pill" key={filter.key}>
                {filter.label}
                <strong>{filter.count}</strong>
              </span>
            ))}
          </div>
          {data.meta.notes.length > 0 ? (
            <ul className="note-list">
              {data.meta.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="report-layout">
        <aside className="report-nav">
          <div className="nav-card">
            <span className="nav-kicker">问卷结构</span>
            <h2>快速跳转</h2>
            <nav>
              {data.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  <span>{section.indexLabel}</span>
                  <strong>{section.title}</strong>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="section-stack">
          {data.sections.map((section) => (
            <section className="section-card" id={section.id} key={section.id}>
              <div className="section-head">
                <div>
                  <span className="section-index">{section.indexLabel}</span>
                  <h2>{section.title}</h2>
                </div>
                {section.description ? (
                  <p className="section-description">{section.description}</p>
                ) : null}
              </div>

              <div className="question-stack">
                {section.questions.map((question) => (
                  <QuestionBlock
                    key={question.id}
                    question={question}
                    filters={data.meta.filters}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
