import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const missingTrackByRule: Rule = {
  id: 'missing-trackby',
  name: 'Missing TrackBy',
  description:
    'Detects Angular ngFor directives that do not use trackBy, which can cause unnecessary DOM re-renders',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue;

        const decoratorText = componentDecorator.getText();

        const templateMatch = decoratorText.match(
          /template\s*:\s*`([\s\S]*?)`/
        );

        if (!templateMatch) continue;

        const template = templateMatch[1];

        const ngForMatches = template.match(/\*ngFor\s*=\s*"[^"]*"/g) || [];

        for (const ngFor of ngForMatches) {
          if (!ngFor.includes('trackBy')) {
            issues.push({
              ruleId: 'missing-trackby',
              severity: 'medium',
              message: `Component "${cls.getName()}" contains an *ngFor without trackBy`,
              filePath: sourceFile.getFilePath(),
              line: componentDecorator.getStartLineNumber(),
              impact:
                'Without trackBy, Angular may recreate DOM elements unnecessarily when collections change, causing performance degradation in large lists',
              suggestion:
                'Add a trackBy function to the *ngFor directive to help Angular identify items efficiently',
            });
          }
        }
      }
    }

    return issues;
  },
};