import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { highCyclomaticComplexityRule } from '../high-cyclomatic-complexity.rule';

function createTestProject(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return { project, sourceFiles: [sourceFile], projectPath: '/fake' };
}

describe('high-cyclomatic-complexity rule', () => {
  it('should detect a method with high complexity', () => {
    const context = createTestProject(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        complexMethod(a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean) {
          if (a) { return 1; }
          if (b) { return 2; }
          if (c) { return 3; }
          if (d) { return 4; }
          if (e) { return 5; }
          if (f) { return 6; }
          for (let i = 0; i < 10; i++) {
            if (a && b) { return 7; }
            if (c || d) { return 8; }
          }
          return 0;
        }
      }
    `);

    const issues = highCyclomaticComplexityRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('high-cyclomatic-complexity');
    expect(issues[0].severity).toBe('medium');
  });

  it('should not flag a simple method', () => {
    const context = createTestProject(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        simpleMethod(value: string): string {
          return value.trim();
        }
      }
    `);

    const issues = highCyclomaticComplexityRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag classes that are not components', () => {
    const context = createTestProject(`
      export class SomeService {
        complexMethod(a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean) {
          if (a) { return 1; }
          if (b) { return 2; }
          if (c) { return 3; }
          if (d) { return 4; }
          if (e) { return 5; }
          if (f) { return 6; }
          for (let i = 0; i < 10; i++) {
            if (a && b) { return 7; }
          }
          return 0;
        }
      }
    `);

    const issues = highCyclomaticComplexityRule.run(context);
    expect(issues).toHaveLength(0);
  });
});