import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { largeBundleImportRule } from '../large-bundle-import.rule';

function createTestProject(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return { project, sourceFiles: [sourceFile], projectPath: '/fake' };
}

describe('large-bundle-import rule', () => {
  it('should detect a namespace import of lodash', () => {
    const context = createTestProject(`
      import * as _ from 'lodash';
      export class MyComponent {}
    `);

    const issues = largeBundleImportRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('large-bundle-import');
    expect(issues[0].severity).toBe('medium');
  });

  it('should detect a moment import', () => {
    const context = createTestProject(`
      import moment from 'moment';
      export class MyComponent {}
    `);

    const issues = largeBundleImportRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('large-bundle-import');
  });

  it('should not flag named imports of lodash', () => {
    const context = createTestProject(`
      import { debounce } from 'lodash';
      export class MyComponent {}
    `);

    const issues = largeBundleImportRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag imports of non-heavy libraries', () => {
    const context = createTestProject(`
      import * as something from 'some-small-lib';
      export class MyComponent {}
    `);

    const issues = largeBundleImportRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should detect namespace import of rxjs', () => {
    const context = createTestProject(`
      import * as rxjs from 'rxjs';
      export class MyComponent {}
    `);

    const issues = largeBundleImportRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('rxjs');
  });
});