import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildServer } from '../app';
import * as analyzer from '@myorg/analyzer';

vi.mock('@myorg/analyzer', () => ({
  chatWithIssue: vi.fn(),
  explainIssue: vi.fn(),
  analyzeProject: vi.fn(),
}));

describe('API routes', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return health status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return AI chat response', async () => {
    vi.mocked(analyzer.chatWithIssue).mockResolvedValue({
      message: 'Use OnPush strategy',
    });

    const response = await server.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        issue: {
          ruleId: 'missing-onpush',
          severity: 'medium',
          message: 'Component does not use OnPush',
          filePath: 'app.component.ts',
          impact: 'More change detection cycles',
          suggestion: 'Use OnPush',
        },
        messages: [
          {
            role: 'user',
            content: 'How do I fix this?',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      message: 'Use OnPush strategy',
    });
  });

  it('should return 500 when AI chat fails', async () => {
    vi.mocked(analyzer.chatWithIssue).mockResolvedValue(null);
  
    const response = await server.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        issue: {
          ruleId: 'missing-onpush',
          severity: 'medium',
          message: 'Component does not use OnPush',
          filePath: 'app.component.ts',
          impact: 'More change detection cycles',
          suggestion: 'Use OnPush',
        },
        messages: [
          {
            role: 'user',
            content: 'How do I fix this?',
          },
        ],
      },
    });
  
    expect(response.statusCode).toBe(500);
  
    expect(response.json()).toEqual({
      error: 'AI chat failed',
    });
  });
  
  it('should return AI explanation', async () => {
    vi.mocked(analyzer.explainIssue).mockResolvedValue({
      summary: 'Uses default change detection',
      whyItMatters: 'Can trigger unnecessary renders',
      howToFix: 'Use OnPush',
      codeExample: '@Component(...)',
    });
  
    const response = await server.inject({
      method: 'POST',
      url: '/explain',
      payload: {
        issue: {
          ruleId: 'missing-onpush',
          severity: 'medium',
          message: 'Component does not use OnPush',
          filePath: 'app.component.ts',
          impact: 'More change detection cycles',
          suggestion: 'Use OnPush',
        },
      },
    });
  
    expect(response.statusCode).toBe(200);
  });

  it('should return 500 when AI explanation fails', async () => {
    vi.mocked(analyzer.explainIssue).mockResolvedValue(null);
  
    const response = await server.inject({
      method: 'POST',
      url: '/explain',
      payload: {
        issue: {
          ruleId: 'missing-onpush',
          severity: 'medium',
          message: 'Component does not use OnPush',
          filePath: 'app.component.ts',
          impact: 'More change detection cycles',
          suggestion: 'Use OnPush',
        },
      },
    });
  
    expect(response.statusCode).toBe(500);
  
    expect(response.json()).toEqual({
      error: 'AI explanation failed',
    });
  });
});