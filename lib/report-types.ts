export type FilterTab = {
  key: string;
  label: string;
  baseLabel: string;
  count: number;
  rawValue: string;
};

export type DistributionOption = {
  label: string;
  count: number;
  ratio: number;
};

export type StatBlock = {
  baseCount: number;
  validCount: number;
  missingCount: number;
  options: DistributionOption[];
  note: string;
  meanScore?: number | null;
  highScoreRate?: number | null;
};

export type SimpleQuestionKind =
  | "single_choice"
  | "rating"
  | "multiple_choice"
  | "open_text";

export type SimpleQuestion = {
  id: string;
  code: string;
  kind: SimpleQuestionKind;
  title: string;
  badge: string;
  description: string;
  statsByAudience: Record<string, StatBlock>;
};

export type MatrixItem = {
  id: string;
  title: string;
  statsByAudience: Record<string, StatBlock>;
};

export type MatrixQuestion = {
  id: string;
  code: string;
  kind: "matrix_rating";
  title: string;
  badge: string;
  description: string;
  items: MatrixItem[];
};

export type Branch = {
  id: string;
  code: string;
  label: string;
  applicableAudiences: string[];
  items: MatrixItem[];
};

export type BranchQuestion = {
  id: string;
  kind: "branch_matrix";
  title: string;
  badge: string;
  description: string;
  branches: Branch[];
};

export type Question = SimpleQuestion | MatrixQuestion | BranchQuestion;

export type Section = {
  id: string;
  indexLabel: string;
  title: string;
  description: string;
  questions: Question[];
};

export type Highlight = {
  label: string;
  value: string;
  detail: string;
};

export type ReportData = {
  meta: {
    title: string;
    subtitle: string;
    generatedAt: string;
    responseCount: number;
    audienceQuestion: string;
    filters: FilterTab[];
    notes: string[];
    audienceLookup: Record<string, FilterTab>;
  };
  highlights: Highlight[];
  sections: Section[];
};
