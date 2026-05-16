import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AnalysisApiService, AnalysisResult } from '../../services/analysis-api.service';

@Component({
  selector: 'app-analysis-detail',
  imports: [RouterModule],
  templateUrl: './analysis-detail.component.html',
})
export class AnalysisDetailComponent implements OnInit {
  private api = inject(AnalysisApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal<string | null>(null);
  result = signal<AnalysisResult | null>(null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No analysis ID provided');
      this.loading.set(false);
      return;
    }

    try {
      const result = await this.api.getById(id);
      this.result.set(result);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}