import { describe, it, expect } from 'vitest';
import { analyzeProject } from './analyzer';

describe('analyzeProject', () => {
  it('should throw if the project path has no tsconfig.json', async () => {
    await expect(analyzeProject('/nonexistent/path')).rejects.toThrow(
      'No tsconfig.json found at /nonexistent/path'
    );
  });
});