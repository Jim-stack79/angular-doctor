export { analyzeProject } from './lib/analyzer';
export type { AnalysisResult, Issue, Severity, AIExplanation, IssueWithAI, AnalysisResultWithAI, 
    ChatRole,
    ChatMessage } from './lib/types';
export { explainIssue } from './lib/ai/ai.service';
export { chatWithIssue } from './lib/ai/ai.service';