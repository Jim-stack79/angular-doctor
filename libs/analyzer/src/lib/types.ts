export type Severity = 'high' | 'medium' | 'low';

export interface Issue {
  ruleId: string;
  severity: Severity;
  message: string;
  filePath: string;
  line?: number;
  impact: string;
  suggestion: string;
}

export interface AnalysisResult {
  projectPath: string;
  analyzedAt: Date;
  issues: Issue[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
}