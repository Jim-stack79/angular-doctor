import { Issue } from "../types";

export function buildChatPrompt(
    issue: Issue,
    messages: { role: 'user' | 'assistant'; content: string }[]
  ): string {
        return `
      You are Angular Doctor.
  
      You are helping debug an Angular static analysis issue.
  
      ISSUE:
      ${JSON.stringify(issue, null, 2)}
  
      CONVERSATION:
      ${messages
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n')}
  
      INSTRUCTIONS:
      - Answer ONLY the last user question.
      - Be concise and practical.
      - Focus on Angular best practices.
      - If needed, reference Signals, RxJS, change detection, etc.
      `.trim();
  }