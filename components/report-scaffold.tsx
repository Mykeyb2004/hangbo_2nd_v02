import type { ReactNode } from "react";

type ReportScaffoldProps = {
  children: ReactNode;
};

export function ReportScaffold({ children }: ReportScaffoldProps) {
  return (
    <main className="report-shell">
      <div className="report-orb report-orb-one" />
      <div className="report-orb report-orb-two" />
      {children}
    </main>
  );
}
