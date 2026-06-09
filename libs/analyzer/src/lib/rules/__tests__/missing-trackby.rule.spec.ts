import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { missingTrackByRule } from '../missing-trackby.rule';

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

describe('missingTrackByRule', () => {
  it('detects ngFor without trackBy', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-users',
        template: \`
          <ul>
            <li *ngFor="let user of users">
              {{ user.name }}
            </li>
          </ul>
        \`
      })
      export class UsersComponent {
        users = [];
      }
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('missing-trackby');
    expect(issues[0].severity).toBe('high');
  });

  it('does not flag ngFor using trackBy', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-users',
        template: \`
          <ul>
            <li *ngFor="let user of users; trackBy: trackById">
              {{ user.name }}
            </li>
          </ul>
        \`
      })
      export class UsersComponent {
        users = [];

        trackById(index: number, user: any) {
          return user.id;
        }
      }
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(0);
  });

  it('detects Angular 17 @for without track', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-users',
        template: \`
          @for (user of users) {
            <div>{{ user.name }}</div>
          }
        \`
      })
      export class UsersComponent {
        users = [];
      }
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('missing-trackby');
    expect(issues[0].severity).toBe('high');
  });

  it('does not flag Angular 17 @for with track', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-users',
        template: \`
          @for (user of users; track user.id) {
            <div>{{ user.name }}</div>
          }
        \`
      })
      export class UsersComponent {
        users = [];
      }
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(0);
  });

  it('ignores readonly static collections', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-statuses',
        template: \`
          <li *ngFor="let status of statuses">
            {{ status }}
          </li>
        \`
      })
      export class StatusesComponent {
        readonly statuses = [
          'Pending',
          'Approved',
          'Rejected'
        ];
      }
    `);

    const issues = missingTrackByRule.run(context);

    expect(issues).toHaveLength(0);
  });
});