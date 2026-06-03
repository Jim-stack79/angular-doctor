import { CallExpression, SyntaxKind } from 'ts-morph';
import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const directDomManipulationRule: Rule = {
  id: 'direct-dom-manipulation',
  name: 'Direct DOM Manipulation',
  description: 'Avoid direct DOM manipulation via document.querySelector or ElementRef.nativeElement',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue;

        const callExpressions = cls.getDescendantsOfKind(SyntaxKind.CallExpression);

        for (const call of callExpressions) {
          const text = call.getExpression().getText();

          if (
            text === 'document.querySelector' ||
            text === 'document.querySelectorAll' ||
            text === 'document.getElementById' ||
            text === 'document.getElementsByClassName'
          ) {
            issues.push({
              ruleId: 'direct-dom-manipulation',
              severity: 'medium',
              message: `Component "${cls.getName()}" uses "${text}()" to access the DOM directly`,
              filePath: sourceFile.getFilePath(),
              line: call.getStartLineNumber(),
              impact: 'Direct DOM access bypasses Angular\'s change detection and breaks server-side rendering',
              suggestion: 'Use @ViewChild with ElementRef, or the Renderer2 service for DOM interactions',
            });
          }
        }

        // Detectar nativeElement
        const propertyAccess = cls.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);

        for (const prop of propertyAccess) {
          if (prop.getName() !== 'nativeElement') continue;

          const parent = prop.getParent();

          if (parent?.getKind() === SyntaxKind.CallExpression) {
            const call = parent as CallExpression;
            // e.g. this.el.nativeElement.focus() — nativeElement is the call target
            if (call.getExpression() !== prop) continue;
          } else if (parent?.getKind() !== SyntaxKind.PropertyAccessExpression) {
            // e.g. nativeElement passed as arg to renderer.setStyle(...)
            continue;
          }

          issues.push({
            ruleId: 'direct-dom-manipulation',
            severity: 'medium',
            message: `Component "${cls.getName()}" accesses the DOM directly via nativeElement`,
            filePath: sourceFile.getFilePath(),
            line: prop.getStartLineNumber(),
            impact:
              "Direct DOM access via nativeElement bypasses Angular's change detection and breaks server-side rendering",
            suggestion:
              'Use Renderer2 methods instead of accessing nativeElement directly',
          });
        }
      }
    }

    return issues;
  },
};