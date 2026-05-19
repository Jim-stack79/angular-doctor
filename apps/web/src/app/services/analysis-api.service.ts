import { Injectable, signal } from '@angular/core';

const API_URL = 'http://localhost:3333';

export interface Issue {
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  filePath: string;
  line?: number;
  impact: string;
  suggestion: string;
  aiExplanation?: {
    summary: string;
    whyItMatters: string;
    howToFix: string;
    codeExample?: string;
  };
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  result: {
    projectPath: string;
    analyzedAt: string;
    issues: Issue[];
    summary: {
      total: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AnalysisApiService {
  async analyze(projectPath: string, withAI = false): Promise<AnalysisResult> {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath, withAI }),
    });

    if (!response.ok) {
      const error = await response.json() as { error: string };
      throw new Error(error.error ?? 'Analysis failed');
    }

    return response.json() as Promise<AnalysisResult>;
  }

  async getAll(): Promise<AnalysisResult[]> {
    const response = await fetch(`${API_URL}/analyses`);
    return response.json() as Promise<AnalysisResult[]>;
  }

  async getById(id: string): Promise<AnalysisResult> {
    const response = await fetch(`${API_URL}/analyses/${id}`);
    if (!response.ok) throw new Error('Analysis not found');
    return response.json() as Promise<AnalysisResult>;
  }

  async explainIssue(issue: Issue): Promise<{
    summary: string;
    whyItMatters: string;
    howToFix: string;
    codeExample?: string;
  }> {
    const response = await fetch(`${API_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue }),
    });
  
    if (!response.ok) throw new Error('AI explanation failed');
    return response.json();
  }
}