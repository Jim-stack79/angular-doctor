import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { noAnyTypeRule } from '../no-any-type.rule';

function createTestProject(filename: string, code: string) {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile(filename, code);

  return {
    project,
    sourceFiles: [sourceFile],
    projectPath: '/fake',
  };
}

describe('no-any-type rule', () => {

  it('should detect a property typed as any', () => {
    const context = createTestProject('app.component.ts', `
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-root',
        template: ''
      })
      export class AppComponent {
        data: any;
      }
    `);

    const issues = noAnyTypeRule.run(context);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('no-any-type');
    expect(issues[0].severity).toBe('medium');
  });

  it('should not flag strongly typed properties', () => {
    const context = createTestProject('app.component.ts', `
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-root',
        template: ''
      })
      export class AppComponent {
        name: string = '';
        age: number = 0;
      }
    `);

    const issues = noAnyTypeRule.run(context);

    expect(issues).toHaveLength(0);
  });

  it('should ignore non Angular classes', () => {
    const context = createTestProject('user.ts', `
      export class User {
        data: any;
      }
    `);

    const issues = noAnyTypeRule.run(context);

    expect(issues).toHaveLength(0);
  });

  it('should detect multiple any properties', () => {
    const context = createTestProject('app.component.ts', `
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-root',
        template: ''
      })
      export class AppComponent {
        first: any;
        second: any;
      }
    `);

    const issues = noAnyTypeRule.run(context);

    expect(issues).toHaveLength(2);
  });

});