import { SyntaxKind } from 'ts-morph';
import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const missingLazyLoadingRule: Rule = {
  id: 'missing-lazy-loading',
  name: 'Missing Lazy Loading',
  description: 'Routes should use lazy loading to reduce the initial bundle size',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    const routingFiles = sourceFiles.filter((sf) => {
      const path = sf.getFilePath();
      return path.includes('routing') || path.includes('app.routes');
    });

    for (const sourceFile of routingFiles) {
      const arrays = sourceFile.getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression);

      for (const array of arrays) {
        const objects = array.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression);

        for (const obj of objects) {
          const hasPath = obj.getProperty('path');
          const hasComponent = obj.getProperty('component');
          const hasLoadChildren = obj.getProperty('loadChildren');
          const hasLoadComponent = obj.getProperty('loadComponent');

          if (hasPath && hasComponent && !hasLoadChildren && !hasLoadComponent) {
            const pathProp = hasPath.getText();
            const line = obj.getStartLineNumber();

            issues.push({
              ruleId: 'missing-lazy-loading',
              severity: 'medium',
              message: `Route "${pathProp}" uses eagerly loaded component instead of lazy loading`,
              filePath: sourceFile.getFilePath(),
              line,
              impact: 'Increases initial bundle size, slowing down first load for all users',
              suggestion: 'Replace "component" with "loadComponent: () => import(...)" for lazy loading',
            });
          }
        }
      }
    }

    return issues;
  },
};