import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { noCircularDepsRule } from '../no-circular-deps.rule';

function createTestProject(files: Record<string, string>) {
  const project = new Project({ useInMemoryFileSystem: true });
  for (const [filename, code] of Object.entries(files)) {
    project.createSourceFile(filename, code);
  }
  const sourceFiles = project.getSourceFiles();
  return { project, sourceFiles, projectPath: '/fake' };
}

describe('no-circular-deps rule', () => {
  it('should detect a direct circular dependency (A -> B -> A)', () => {
    const context = createTestProject({
      '/a.ts': `import { b } from './b';`,
      '/b.ts': `import { a } from './a';`,
    });

    const issues = noCircularDepsRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('no-circular-deps');
    expect(issues[0].severity).toBe('high');
  });

  it('should detect an indirect circular dependency (A -> B -> C -> A)', () => {
    const context = createTestProject({
      '/a.ts': `import { b } from './b';`,
      '/b.ts': `import { c } from './c';`,
      '/c.ts': `import { a } from './a';`,
    });

    const issues = noCircularDepsRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('high');
  });

  it('should not flag files without circular dependencies', () => {
    const context = createTestProject({
      '/a.ts': `import { b } from './b';`,
      '/b.ts': `import { c } from './c';`,
      '/c.ts': `export const c = 'c';`,
    });

    const issues = noCircularDepsRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag files with no imports', () => {
    const context = createTestProject({
      '/a.ts': `export const a = 1;`,
      '/b.ts': `export const b = 2;`,
    });

    const issues = noCircularDepsRule.run(context);
    expect(issues).toHaveLength(0);
  });
});