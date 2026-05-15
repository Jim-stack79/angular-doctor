import { randomUUID } from 'crypto';
import { analyzeProject, explainIssue } from '@myorg/analyzer';
import type { AnalysisResult, IssueWithAI } from '@myorg/analyzer';

interface StoredAnalysis {
  id: string;
  createdAt: Date;
  result: AnalysisResult & { issues: IssueWithAI[] };
}

export class AnalysisService {
  private store = new Map<string, StoredAnalysis>();

  async analyze(projectPath: string, withAI = false): Promise<StoredAnalysis> {
    const result = await analyzeProject(projectPath);

    let issues: IssueWithAI[] = result.issues;

    if (withAI && result.issues.length > 0) {
      issues = await Promise.all(
        result.issues.map(async (issue) => ({
          ...issue,
          aiExplanation: (await explainIssue(issue)) ?? undefined,
        }))
      );
    }

    const stored: StoredAnalysis = {
      id: randomUUID(),
      createdAt: new Date(),
      result: { ...result, issues },
    };

    this.store.set(stored.id, stored);
    return stored;
  }

  getAll(): StoredAnalysis[] {
    return Array.from(this.store.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getById(id: string): StoredAnalysis | undefined {
    return this.store.get(id);
  }
}