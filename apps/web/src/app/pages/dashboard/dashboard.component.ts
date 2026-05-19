import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalysisApiService, AnalysisResult, Issue } from '../../services/analysis-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private api = inject(AnalysisApiService);

  projectPath = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<AnalysisResult | null>(null);

  // Estado de IA por issue: key = ruleId+filePath, value = 'idle' | 'loading' | 'done'
  aiLoadingMap = signal<Record<string, 'idle' | 'loading' | 'done'>>({});
  aiExplanations = signal<Record<string, Issue['aiExplanation']>>({});

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
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
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
}