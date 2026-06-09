import { z } from 'zod';
import type { Issue, AIExplanation, ChatMessage } from '../types';
import { buildChatPrompt } from './prompt.builder';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3.2';

const AIResponseSchema = z.object({
  summary: z.string(),
  whyItMatters: z.string(),
  howToFix: z.string(),
  codeExample: z.string().optional(),
});

export async function explainIssue(issue: Issue): Promise<AIExplanation | null> {
  const prompt = buildPrompt(issue);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as { response: string };
    const parsed = JSON.parse(data.response);
    const validated = AIResponseSchema.safeParse(parsed);

    if (!validated.success) return null;

    return validated.data;
  } catch {
    return null;
  }
}

export async function chatWithIssue(
  issue: Issue,
  messages: ChatMessage[]
): Promise<{ message: string } | null> {
  const prompt = buildChatPrompt(issue, messages);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        // 👇 IMPORTANTE: aquí NO forzamos JSON
        // porque queremos texto libre conversacional
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as { response: string };

    return {
      message: data.response.trim(),
    };
  } catch {
    return null;
  }
}


function buildPrompt(issue: Issue): string {
  return `You are an Angular expert analyzing code quality issues.

    An automated tool detected the following issue:
    - Rule: ${issue.ruleId}
    - Severity: ${issue.severity}
    - Message: ${issue.message}
    - File: ${issue.filePath}
    - Impact: ${issue.impact}
    - Suggestion: ${issue.suggestion}

    Respond ONLY with a valid JSON object with exactly these fields:
    {
    "summary": "One sentence explaining what this issue is",
    "whyItMatters": "Two or three sentences explaining why this is a real problem in production Angular apps",
    "howToFix": "Clear step-by-step instructions to fix this issue",
    "codeExample": "A short before/after code snippet showing the fix (optional, include only if it adds value)"
    }

    Do not include any text outside the JSON object.`;
}