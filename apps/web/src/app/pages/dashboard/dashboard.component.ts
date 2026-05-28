import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalysisApiService, AnalysisResult, Issue } from '../../services/analysis-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private api = inject(AnalysisApiService);
  private readonly lastProjectPathKey = 'dashboard:lastProjectPath';
  private readonly hasResultsKey = 'dashboard:hasResults';

  projectPath = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<AnalysisResult | null>(null);

  // Estado de IA por issue: key = ruleId+filePath, value = 'idle' | 'loading' | 'done'
  aiLoadingMap = signal<Record<string, 'idle' | 'loading' | 'done'>>({});
  aiExplanations = signal<Record<string, Issue['aiExplanation']>>({});

  ngOnInit() {
    const savedProjectPath = this.readStorage(this.lastProjectPathKey);
    const hadResults = this.readStorage(this.hasResultsKey) === 'true';

    if (savedProjectPath) {
      this.projectPath.set(savedProjectPath);
    }

    if (savedProjectPath && hadResults) {
      void this.analyze();
    }
  }

  async analyze() {
    if (!this.projectPath()) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.aiLoadingMap.set({});
    this.aiExplanations.set({});

    try {
      const result = await this.api.analyze(this.projectPath());
      this.result.set(result);
      this.writeStorage(this.lastProjectPathKey, this.projectPath());
      this.writeStorage(this.hasResultsKey, 'true');
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  resetDashboard() {
    this.projectPath.set('');
    this.error.set(null);
    this.result.set(null);
    this.loading.set(false);
    this.aiLoadingMap.set({});
    this.aiExplanations.set({});
    this.removeStorage(this.lastProjectPathKey);
    this.removeStorage(this.hasResultsKey);
  }

  issueKey(issue: Issue): string {
    return issue.ruleId + issue.filePath;
  }

  async explainIssue(issue: Issue) {
    const key = this.issueKey(issue);
    this.aiLoadingMap.update(m => ({ ...m, [key]: 'loading' }));

    try {
      const explanation = await this.api.explainIssue(issue);
      this.aiExplanations.update(e => ({ ...e, [key]: explanation }));
      this.aiLoadingMap.update(m => ({ ...m, [key]: 'done' }));
    } catch {
      this.aiLoadingMap.update(m => ({ ...m, [key]: 'idle' }));
    }
  }

  getAIState(issue: Issue): 'idle' | 'loading' | 'done' {
    return this.aiLoadingMap()[this.issueKey(issue)] ?? 'idle';
  }

  getAIExplanation(issue: Issue) {
    return this.aiExplanations()[this.issueKey(issue)];
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  }

  private removeStorage(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  }
}