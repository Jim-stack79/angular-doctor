import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalysisApiService, AnalysisResult } from '../../services/analysis-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private api = inject(AnalysisApiService);

  projectPath = signal('');
  withAI = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<AnalysisResult | null>(null);

  async analyze() {
    if (!this.projectPath()) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    try {
      const result = await this.api.analyze(this.projectPath(), this.withAI());
      this.result.set(result);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}