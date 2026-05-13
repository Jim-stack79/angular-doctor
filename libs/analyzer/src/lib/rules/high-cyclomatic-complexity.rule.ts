import { SyntaxKind } from 'ts-morph';
import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

const COMPLEXITY_THRESHOLD = 10;

export const highCyclomaticComplexityRule: Rule = {
  id: 'high-cyclomatic-complexity',
  name: 'High Cyclomatic Complexity',
  description: `Methods with cyclomatic complexity above ${COMPLEXITY_THRESHOLD} are harder to test and maintain`,

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');
        if (!componentDecorator) continue;

        for (const method of cls.getMethods()) {
          const complexity = calculateComplexity(method.getBody()?.getText() ?? '');

          if (complexity > COMPLEXITY_THRESHOLD) {
            issues.push({
              ruleId: 'high-cyclomatic-complexity',
              severity: 'medium',
              message: `Method "${method.getName()}" in "${cls.getName()}" has cyclomatic complexity of ${complexity} (threshold: ${COMPLEXITY_THRESHOLD})`,
              filePath: sourceFile.getFilePath(),
              line: method.getStartLineNumber(),
              impact: 'High complexity makes the method hard to test, understand, and maintain',
              suggestion: `Break "${method.getName()}" into smaller, focused methods with a single responsibility`,
            });
          }
        }
      }
    }

    return issues;
  },
};

// Complejidad ciclomática = 1 + número de puntos de decisión
function calculateComplexity(code: string): number {
  const decisionPoints = [
    /\bif\b/g,
    /\belse if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\b\?\./g,   // optional chaining
    /\?\?/g,     // nullish coalescing
    /&&/g,
    /\|\|/g,
  ];

  let complexity = 1;
  for (const pattern of decisionPoints) {
    complexity += (code.match(pattern) ?? []).length;
  }
  return complexity;
}