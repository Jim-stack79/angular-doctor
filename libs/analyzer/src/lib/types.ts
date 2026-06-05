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

export interface AIExplanation {
  summary: string;
  whyItMatters: string;
  howToFix: string;
  codeExample?: string;
}

export interface IssueWithAI extends Issue {
  aiExplanation?: AIExplanation;
}

export interface AnalysisResultWithAI extends Omit<AnalysisResult, 'issues'> {
  issues: IssueWithAI[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}