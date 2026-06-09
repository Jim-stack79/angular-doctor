import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisService } from '../analysis.service';
import * as analyzer from '@myorg/analyzer';
import type { Issue } from '@myorg/analyzer';

vi.mock('@myorg/analyzer', () => ({
    analyzeProject: vi.fn(),
    explainIssue: vi.fn(),
  }));

  describe('AnalysisService', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    it('should store an analysis and retrieve it by id', async () => {
      const service = new AnalysisService();
  
      vi.mocked(analyzer.analyzeProject).mockResolvedValue({
        projectPath: '/test',
        analyzedAt: new Date(),
        issues: [],
        summary: {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      });
  
      const stored = await service.analyze('/test');
  
      const retrieved = service.getById(stored.id);
  
      expect(retrieved).toEqual(stored);
    });
    it('should return analyses ordered by newest first', async () => {
        const service = new AnalysisService();
      
        vi.mocked(analyzer.analyzeProject).mockResolvedValue({
          projectPath: '/test',
          analyzedAt: new Date(),
          issues: [],
          summary: {
            total: 0,
            high: 0,
            medium: 0,
            low: 0,
          },
        });
      
        const first = await service.analyze('/project-1');
      
        // pequeña pausa para asegurar fechas distintas
        await new Promise(resolve => setTimeout(resolve, 10));
      
        const second = await service.analyze('/project-2');
      
        const results = service.getAll();
      
        expect(results).toHaveLength(2);
        expect(results[0].id).toBe(second.id);
        expect(results[1].id).toBe(first.id);
      });
      it('should enrich issues with AI explanations when withAI is true', async () => {
        const service = new AnalysisService();
      
        const issue: Issue = {
          ruleId: 'missing-onpush',
          severity: 'medium',
          message: 'Component does not use OnPush',
          filePath: 'app.component.ts',
          impact: 'More change detection cycles',
          suggestion: 'Use OnPush',
        };
      
        vi.mocked(analyzer.analyzeProject).mockResolvedValue({
          projectPath: '/test',
          analyzedAt: new Date(),
          issues: [issue],
          summary: {
            total: 1,
            high: 0,
            medium: 1,
            low: 0,
          },
        });
      
        vi.mocked(analyzer.explainIssue).mockResolvedValue({
          summary: 'Use OnPush strategy',
          whyItMatters: 'Improves performance',
          howToFix: 'Add ChangeDetectionStrategy.OnPush',
        });
      
        const result = await service.analyze('/test', true);
      
        expect(analyzer.explainIssue).toHaveBeenCalledWith(issue);
      
        expect(result.result.issues[0].aiExplanation).toEqual({
          summary: 'Use OnPush strategy',
          whyItMatters: 'Improves performance',
          howToFix: 'Add ChangeDetectionStrategy.OnPush',
        });
      });
      it('should set aiExplanation to undefined when explainIssue returns null', async () => {
        const service = new AnalysisService();
      
        const issue: Issue = {
          ruleId: 'missing-onpush',
          severity: 'medium',
          message: 'Component does not use OnPush',
          filePath: 'app.component.ts',
          impact: 'More change detection cycles',
          suggestion: 'Use OnPush',
        };
      
        vi.mocked(analyzer.analyzeProject).mockResolvedValue({
          projectPath: '/test',
          analyzedAt: new Date(),
          issues: [issue],
          summary: {
            total: 1,
            high: 0,
            medium: 1,
            low: 0,
          },
        });
      
        vi.mocked(analyzer.explainIssue).mockResolvedValue(null);
      
        const result = await service.analyze('/test', true);
      
        expect(result.result.issues[0].aiExplanation).toBeUndefined();
      });
      it('should not call explainIssue when there are no issues', async () => {
        const service = new AnalysisService();
      
        vi.mocked(analyzer.analyzeProject).mockResolvedValue({
          projectPath: '/test',
          analyzedAt: new Date(),
          issues: [],
          summary: {
            total: 0,
            high: 0,
            medium: 0,
            low: 0,
          },
        });
      
        await service.analyze('/test', true);
      
        expect(analyzer.explainIssue).not.toHaveBeenCalled();
      });
  });