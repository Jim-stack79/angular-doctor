import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { missingOnPushRule } from '../missing-onpush.rule';

function createTestProject(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return { project, sourceFiles: [sourceFile], projectPath: '/fake' };
}

describe('missing-onpush rule', () => {
  it('should detect a component without OnPush', () => {
    const context = createTestProject(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {}
    `);

    const issues = missingOnPushRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('missing-onpush');
    expect(issues[0].severity).toBe('medium');
  });

  it('should not flag a component with OnPush', () => {
    const context = createTestProject(`
      import { Component, ChangeDetectionStrategy } from '@angular/core';

      @Component({
        selector: 'app-test',
        template: '',
        changeDetection: ChangeDetectionStrategy.OnPush
      })
      export class TestComponent {}
    `);

    const issues = missingOnPushRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag a class that is not a component', () => {
    const context = createTestProject(`
      export class SomeService {
        getData() { return []; }
      }
    `);

    const issues = missingOnPushRule.run(context);
    expect(issues).toHaveLength(0);
  });
});