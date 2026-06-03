import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { largeComponentRule } from '../large-component.rule';

function createContext(code: string) {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile(
    'test.component.ts',
    code
  );

  return {
    project,
    sourceFiles: [sourceFile],
    projectPath: '/test',
  };
}

function createLargeComponent(lines: number): string {
  const properties = Array.from(
    { length: lines },
    (_, i) => `property${i} = ${i};`
  ).join('\n');

  return `
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-test',
      template: ''
    })
    export class TestComponent {
      ${properties}
    }
  `;
}

describe('largeComponentRule', () => {
  it('detects medium-sized large components', () => {
    const context = createContext(
      createLargeComponent(600)
    );

    const issues = largeComponentRule.run(context);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('large-component');
    expect(issues[0].severity).toBe('medium');
  });

  it('detects extremely large components', () => {
    const context = createContext(
      createLargeComponent(1200)
    );

    const issues = largeComponentRule.run(context);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('large-component');
    expect(issues[0].severity).toBe('high');
  });

  it('does not flag small components', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-test',
        template: ''
      })
      export class TestComponent {
        name = 'Angular Doctor';
      }
    `);

    const issues = largeComponentRule.run(context);

    expect(issues).toHaveLength(0);
  });
});