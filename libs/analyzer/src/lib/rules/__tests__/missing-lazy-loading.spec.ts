import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { missingLazyLoadingRule } from '../missing-lazy-loading.rule';

function createTestProject(filename: string, code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(filename, code);
  return { project, sourceFiles: [sourceFile], projectPath: '/fake' };
}

describe('missing-lazy-loading rule', () => {
  it('should detect an eagerly loaded route', () => {
    const context = createTestProject('app.routes.ts', `
      import { HomeComponent } from './home.component';

      export const routes = [
        { path: 'home', component: HomeComponent }
      ];
    `);

    const issues = missingLazyLoadingRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('missing-lazy-loading');
    expect(issues[0].severity).toBe('medium');
  });

  it('should not flag a route with loadComponent', () => {
    const context = createTestProject('app.routes.ts', `
      export const routes = [
        {
          path: 'home',
          loadComponent: () => import('./home.component').then(m => m.HomeComponent)
        }
      ];
    `);

    const issues = missingLazyLoadingRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should not flag a route with loadChildren', () => {
    const context = createTestProject('app.routes.ts', `
      export const routes = [
        {
          path: 'admin',
          loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
        }
      ];
    `);

    const issues = missingLazyLoadingRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should ignore non-routing files', () => {
    const context = createTestProject('some.component.ts', `
      const items = [
        { path: 'home', component: 'SomeComponent' }
      ];
    `);

    const issues = missingLazyLoadingRule.run(context);
    expect(issues).toHaveLength(0);
  });
});