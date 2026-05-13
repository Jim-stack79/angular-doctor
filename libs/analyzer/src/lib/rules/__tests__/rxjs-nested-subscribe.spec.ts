import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { rxjsNestedSubscribeRule } from '../rxjs-nested-subscribe.rule';

function createTestProject(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return { project, sourceFiles: [sourceFile], projectPath: '/fake' };
}

describe('rxjs-nested-subscribe rule', () => {
  it('should detect a subscribe inside a subscribe', () => {
    const context = createTestProject(`
      import { Component, OnInit } from '@angular/core';
      import { of } from 'rxjs';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent implements OnInit {
        ngOnInit() {
          of(1).subscribe(val => {
            of(val).subscribe(inner => console.log(inner));
          });
        }
      }
    `);

    const issues = rxjsNestedSubscribeRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('rxjs-nested-subscribe');
    expect(issues[0].severity).toBe('high');
  });

  it('should not flag a single subscribe', () => {
    const context = createTestProject(`
      import { Component, OnInit } from '@angular/core';
      import { of } from 'rxjs';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent implements OnInit {
        ngOnInit() {
          of(1).subscribe(val => console.log(val));
        }
      }
    `);

    const issues = rxjsNestedSubscribeRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag a component using switchMap instead', () => {
    const context = createTestProject(`
      import { Component, OnInit } from '@angular/core';
      import { of } from 'rxjs';
      import { switchMap } from 'rxjs/operators';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent implements OnInit {
        ngOnInit() {
          of(1).pipe(
            switchMap(val => of(val))
          ).subscribe(val => console.log(val));
        }
      }
    `);

    const issues = rxjsNestedSubscribeRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag a service with nested subscribes', () => {
    const context = createTestProject(`
      import { Injectable } from '@angular/core';
      import { of } from 'rxjs';

      @Injectable({ providedIn: 'root' })
      export class DataService {
        load() {
          of(1).subscribe(val => {
            of(val).subscribe(inner => console.log(inner));
          });
        }
      }
    `);

    const issues = rxjsNestedSubscribeRule.run(context);
    expect(issues).toHaveLength(0);
  });
});