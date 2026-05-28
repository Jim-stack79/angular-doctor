import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const noAnyTypeRule: Rule = {
  id: 'no-any-type',
  name: 'No Any Type',
  description: 'Detects properties and variables typed as any, which defeats TypeScript strict typing',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue; // only analyse Angular components

        for (const property of cls.getProperties()) {
          const typeText = property.getTypeNode()?.getText();

          if (typeText === 'any') {
            issues.push({
              ruleId: 'no-any-type',
              severity: 'medium',
              message: `Property "${property.getName()}" in "${cls.getName()}" is typed as any`,
              filePath: sourceFile.getFilePath(),
              line: property.getStartLineNumber(),
              impact: 'Using any disables type checking and can hide runtime errors',
              suggestion: 'Replace any with a specific type or use unknown if the type is genuinely uncertain',
            });
          }
        }
      }
    }

    return issues;
  },
};