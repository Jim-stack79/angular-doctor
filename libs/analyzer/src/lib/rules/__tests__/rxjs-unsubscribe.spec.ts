import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { rxjsUnsubscribeRule } from '../rxjs-unsubscribe.rule';

function createTestProject(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return { project, sourceFiles: [sourceFile], projectPath: '/fake' };
}

describe('rxjs-unsubscribe rule', () => {
  it('should detect a component with subscribe but no ngOnDestroy', () => {
    const context = createTestProject(`
      import { Component, OnInit } from '@angular/core';
      import { interval } from 'rxjs';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent implements OnInit {
        ngOnInit() {
          interval(1000).subscribe(val => console.log(val));
        }
      }
    `);

    const issues = rxjsUnsubscribeRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('rxjs-unsubscribe');
    expect(issues[0].severity).toBe('high');
  });

  it('should not flag a component that implements ngOnDestroy', () => {
    const context = createTestProject(`
      import { Component, OnInit, OnDestroy } from '@angular/core';
      import { interval, Subscription } from 'rxjs';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent implements OnInit, OnDestroy {
        private sub: Subscription;

        ngOnInit() {
          this.sub = interval(1000).subscribe(val => console.log(val));
        }

        ngOnDestroy() {
          this.sub.unsubscribe();
        }
      }
    `);

    const issues = rxjsUnsubscribeRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag a component without any subscribe call', () => {
    const context = createTestProject(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        title = 'hello';
      }
    `);

    const issues = rxjsUnsubscribeRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag a service that uses subscribe', () => {
    const context = createTestProject(`
      import { Injectable } from '@angular/core';
      import { interval } from 'rxjs';

      @Injectable({ providedIn: 'root' })
      export class DataService {
        startPolling() {
          interval(1000).subscribe(val => console.log(val));
        }
      }
    `);

    const issues = rxjsUnsubscribeRule.run(context);
    expect(issues).toHaveLength(0);
  });
});