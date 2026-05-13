import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const rxjsUnsubscribeRule: Rule = {
  id: 'rxjs-unsubscribe',
  name: 'RxJS Missing Unsubscribe',
  description: 'Components that subscribe to Observables must implement ngOnDestroy to unsubscribe',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue;

        // Buscamos si el componente llama a .subscribe( en algún método
        const classText = cls.getText();
        const hasSubscribe = classText.includes('.subscribe(');
        if (!hasSubscribe) continue;

        // Comprobamos si implementa ngOnDestroy
        const hasNgOnDestroy = cls.getMethods().some(
          (m) => m.getName() === 'ngOnDestroy'
        );

        if (!hasNgOnDestroy) {
          issues.push({
            ruleId: 'rxjs-unsubscribe',
            severity: 'high',
            message: `Component "${cls.getName()}" uses .subscribe() but does not implement ngOnDestroy`,
            filePath: sourceFile.getFilePath(),
            line: cls.getStartLineNumber(),
            impact: 'Active subscriptions after component destruction cause memory leaks and unexpected behavior',
            suggestion: 'Implement ngOnDestroy and call unsubscribe(), or use the takeUntilDestroyed() operator',
          });
        }
      }
    }

    return issues;
  },
};