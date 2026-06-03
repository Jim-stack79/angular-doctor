import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

const MEDIUM_THRESHOLD = 500;
const HIGH_THRESHOLD = 1000;

export const largeComponentRule: Rule = {
  id: 'large-component',
  name: 'Large Component',
  description:
    'Detects Angular components that have grown excessively large, making them harder to maintain, test and optimize',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');

        if (!componentDecorator) continue;

        const startLine = cls.getStartLineNumber();
        const endLine = cls.getEndLineNumber();

        const totalLines = endLine - startLine + 1;

        if (totalLines < MEDIUM_THRESHOLD) {
          continue;
        }

        const severity =
          totalLines >= HIGH_THRESHOLD
            ? 'high'
            : 'medium';

        issues.push({
          ruleId: 'large-component',
          severity,
          message: `Component "${cls.getName()}" contains ${totalLines} lines of code`,
          filePath: sourceFile.getFilePath(),
          line: startLine,
          impact:
            'Large components are harder to maintain, test, reason about and often indicate multiple responsibilities concentrated in a single class.',
          suggestion:
            'Split the component into smaller feature-focused components, services or directives.',
        });
      }
    }

    return issues;
  },
};