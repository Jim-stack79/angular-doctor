import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { missingTrackByRule } from '../missing-trackby.rule';

function createContext(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);

  return {
    project,
    sourceFiles: [sourceFile],
    projectPath: '/test',
  };
}

describe('missingTrackByRule', () => {
  it('detects ngFor without trackBy', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-test',
        template: \`
          <li *ngFor="let item of items">
            {{ item.name }}
          </li>
        \`
      })
      export class TestComponent {}
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('missing-trackby');
    expect(issues[0].severity).toBe('medium');
  });

  it('does not flag ngFor using trackBy', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-test',
        template: \`
          <li *ngFor="let item of items; trackBy: trackById">
            {{ item.name }}
          </li>
        \`
      })
      export class TestComponent {
        trackById(index: number, item: any) {
          return item.id;
        }
      }
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(0);
  });
});