import { SyntaxKind, CallExpression } from 'ts-morph';
import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const rxjsNestedSubscribeRule: Rule = {
  id: 'rxjs-nested-subscribe',
  name: 'RxJS Nested Subscribe',
  description: 'Avoid subscribing inside a subscribe callback — use operators like switchMap instead',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue;

        // Buscamos todas las llamadas a .subscribe(
        const subscribeCalls = cls.getDescendantsOfKind(SyntaxKind.CallExpression)
          .filter(call => {
            const expr = call.getExpression();
            return expr.getText().endsWith('.subscribe');
          });

        for (const outerSubscribe of subscribeCalls) {
          // Buscamos si dentro del callback hay otro .subscribe(
          const nestedSubscribes = outerSubscribe.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(inner => {
              if (inner === outerSubscribe) return false;
              return inner.getExpression().getText().endsWith('.subscribe');
            });

          if (nestedSubscribes.length > 0) {
            issues.push({
              ruleId: 'rxjs-nested-subscribe',
              severity: 'high',
              message: `Component "${cls.getName()}" has a .subscribe() nested inside another .subscribe()`,
              filePath: sourceFile.getFilePath(),
              line: outerSubscribe.getStartLineNumber(),
              impact: 'Nested subscribes cause memory leaks, uncontrolled side effects and unmaintainable code',
              suggestion: 'Use switchMap, mergeMap, or concatMap to compose Observables instead of nesting subscribes',
            });
          }
        }
      }
    }

    return issues;
  },
};