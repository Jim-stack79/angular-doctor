import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as promptBuilder from '../prompt.builder';
import * as aiService from '../ai.service';

global.fetch = vi.fn();

describe('buildChatPrompt', () => {

    it('should include the issue message', () => {
        const prompt = promptBuilder.buildChatPrompt(
          {
            ruleId: 'missing-onpush',
            severity: 'medium',
            message: 'Component does not use OnPush',
            filePath: 'app.component.ts',
            impact: 'More change detection cycles',
            suggestion: 'Use ChangeDetectionStrategy.OnPush',
          },
          []
        );
      
        expect(prompt).toContain('Component does not use OnPush');
      });

});

describe('chatWithIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call Ollama and return message', async () => {
    const issue = {
      ruleId: 'missing-onpush',
      severity: 'medium',
      message: 'Component does not use OnPush',
      filePath: 'app.component.ts',
      impact: 'More change detection cycles',
      suggestion: 'Use OnPush',
    };
  
    const messages = [
      { role: 'user', content: 'How do I fix this?' }
    ];
  
    const promptSpy = vi.spyOn(promptBuilder, 'buildChatPrompt')
      .mockReturnValue('MOCK_PROMPT');
  
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Use OnPush strategy',
      }),
    });
  
    const result = await aiService.chatWithIssue(issue as any, messages as any);
  
    expect(promptSpy).toHaveBeenCalledWith(issue, messages);
  
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('MOCK_PROMPT'),
      })
    );
  
    expect(result).toEqual({
      message: 'Use OnPush strategy',
    });
  });

  it('should return null when Ollama responds with error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });
  
    const result = await aiService.chatWithIssue(
      {} as any,
      []
    );
  
    expect(result).toBeNull();
  });

  it('should return null when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('Network error')
    );
  
    const result = await aiService.chatWithIssue(
      {} as any,
      []
    );
  
    expect(result).toBeNull();
  });


  it('should return an AI explanation when Ollama responds with valid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          summary: 'Use OnPush strategy',
          whyItMatters: 'Reduces unnecessary change detection',
          howToFix: 'Add ChangeDetectionStrategy.OnPush',
        }),
      }),
    });
  
    const issue = {
      ruleId: 'missing-onpush',
      severity: 'medium',
      message: 'Component does not use OnPush',
      filePath: 'app.component.ts',
      impact: 'More change detection cycles',
      suggestion: 'Use OnPush',
    };
  
    const result = await aiService.explainIssue(issue as any);
  
    expect(result).toEqual({
      summary: 'Use OnPush strategy',
      whyItMatters: 'Reduces unnecessary change detection',
      howToFix: 'Add ChangeDetectionStrategy.OnPush',
    });
  });

  it('should return null when Ollama responds with error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });
  
    const result = await aiService.explainIssue({} as any);
  
    expect(result).toBeNull();
  });

  it('should return null when Ollama returns invalid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'this is not json',
      }),
    });
  
    const result = await aiService.explainIssue({} as any);
  
    expect(result).toBeNull();
  });


  it('should return null when response does not match AIResponseSchema', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          foo: 'bar',
        }),
      }),
    });
  
    const result = await aiService.explainIssue({} as any);
  
    expect(result).toBeNull();
  });

  it('should return null when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('Network error')
    );
  
    const result = await aiService.explainIssue({} as any);
  
    expect(result).toBeNull();
  });


});


describe('buildPrompt', () => {
  it('should include the issue message', () => {
    const prompt = aiService.buildPrompt({
      ruleId: 'missing-onpush',
      severity: 'medium',
      message: 'Component does not use OnPush',
      filePath: 'app.component.ts',
      impact: 'More change detection cycles',
      suggestion: 'Use ChangeDetectionStrategy.OnPush',
    } as any);

    expect(prompt).toContain('Component does not use OnPush');
  });
  it('should include the rule id and severity', () => {
    const prompt = aiService.buildPrompt({
      ruleId: 'missing-onpush',
      severity: 'medium',
      message: 'Component does not use OnPush',
      filePath: 'app.component.ts',
      impact: 'More change detection cycles',
      suggestion: 'Use ChangeDetectionStrategy.OnPush',
    } as any);
  
    expect(prompt).toContain('missing-onpush');
    expect(prompt).toContain('medium');
  });
  it('should instruct the model to return JSON only', () => {
    const prompt = aiService.buildPrompt({
      ruleId: 'missing-onpush',
      severity: 'medium',
      message: 'Component does not use OnPush',
      filePath: 'app.component.ts',
      impact: 'More change detection cycles',
      suggestion: 'Use ChangeDetectionStrategy.OnPush',
    } as any);
  
    expect(prompt).toContain('Respond ONLY with a valid JSON object');
  });
  it('should describe the expected response fields', () => {
    const prompt = aiService.buildPrompt({
      ruleId: 'missing-onpush',
      severity: 'medium',
      message: 'Component does not use OnPush',
      filePath: 'app.component.ts',
      impact: 'More change detection cycles',
      suggestion: 'Use ChangeDetectionStrategy.OnPush',
    } as any);
  
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"whyItMatters"');
    expect(prompt).toContain('"howToFix"');
  });
});