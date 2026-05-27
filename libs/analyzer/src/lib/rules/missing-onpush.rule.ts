import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const missingOnPushRule: Rule = {
  id: 'missing-onpush',
  name: 'Missing OnPush Change Detection',
  description: 'Components should use ChangeDetectionStrategy.OnPush for better performance',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue;

        const args = componentDecorator.getArguments();
        if (args.length === 0) continue;

        const config = args[0];
        const configText = config.getText();

        if (!configText.includes('ChangeDetectionStrategy.OnPush')) {
          issues.push({
            ruleId: 'missing-onpush',
            severity: 'medium',
            message: `Component "${cls.getName() ?? 'unknown'}" does not use ChangeDetectionStrategy.OnPush`,
            filePath: sourceFile.getFilePath(),
            line: cls.getStartLineNumber(),
            impact: 'Component will re-render on every change detection cycle, degrading performance',
            suggestion: 'Add changeDetection: ChangeDetectionStrategy.OnPush to the @Component decorator',
          });
        }
      }
    }

    return issues;
  },
};