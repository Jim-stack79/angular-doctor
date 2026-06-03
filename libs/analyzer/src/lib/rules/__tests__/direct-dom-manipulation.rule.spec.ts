import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { directDomManipulationRule } from '../direct-dom-manipulation.rule';

function createContext(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return {
    project,
    sourceFiles: [sourceFile],
    projectPath: '/test',
  };
}

describe('directDomManipulationRule', () => {
  it('detects document.querySelector in a component', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        ngOnInit() {
          const el = document.querySelector('.my-class');
        }
      }
    `);

    const issues = directDomManipulationRule.run(context);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].ruleId).toBe('direct-dom-manipulation');
    expect(issues[0].severity).toBe('medium');
  });

  it('detects document.getElementById in a component', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        ngOnInit() {
          document.getElementById('my-id').style.display = 'none';
        }
      }
    `);

    const issues = directDomManipulationRule.run(context);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].ruleId).toBe('direct-dom-manipulation');
  });

  it('detects nativeElement usage in a component', () => {
    const context = createContext(`
      import { Component, ElementRef, ViewChild } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        @ViewChild('myDiv') myDiv!: ElementRef;

        ngOnInit() {
          this.myDiv.nativeElement.style.color = 'red';
        }
      }
    `);

    const issues = directDomManipulationRule.run(context);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].ruleId).toBe('direct-dom-manipulation');
  });

  it('does not flag a component that uses Renderer2', () => {
    const context = createContext(`
      import { Component, Renderer2, ElementRef, ViewChild } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        @ViewChild('myDiv') myDiv!: ElementRef;

        constructor(private renderer: Renderer2) {}

        ngOnInit() {
          this.renderer.setStyle(this.myDiv.nativeElement, 'color', 'red');
        }
      }
    `);

    const issues = directDomManipulationRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('does not flag a non-component class', () => {
    const context = createContext(`
      export class MyService {
        doSomething() {
          const el = document.querySelector('.my-class');
        }
      }
    `);

    const issues = directDomManipulationRule.run(context);
    expect(issues).toHaveLength(0);
  });
});