# Adding a new rule to Angular Doctor

The analysis engine is designed to be extended. Adding a new rule requires creating a single file and registering it in one place. Nothing else needs to change.

---

## How the rule system works

Every rule is an object that implements the `Rule` interface:

```typescript
export interface Rule {
  id: string;          // unique identifier, used in issue reports
  name: string;        // human-readable name
  description: string; // what the rule detects
  run(context: RuleContext): Issue[];
}

```

The `RuleContext` gives each rule access to the full project:

```typescript
export interface RuleContext {
  project: Project;          // ts-morph Project instance
  sourceFiles: SourceFile[]; // all Angular-relevant TypeScript files
  projectPath: string;       // absolute path to the analysed project
}

```

When `analyzeProject()` runs, it iterates over all registered rules, calls `run()` on each one, and aggregates the returned `Issue[]` arrays. Results are then sorted by severity.

---

## Step-by-step: adding a new rule

### 1. Create the rule file

Create a new file in `libs/analyzer/src/lib/rules/` following the naming convention:

```
your-rule-name.rule.ts

```

### 2. Implement the Rule interface

Here is a minimal example that detects components using `any` in their class properties:

```typescript
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
          const typeText = property.getType().getText();

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

```

### 3. Register the rule

Open `libs/analyzer/src/lib/analyzer.ts`, import your rule and add it to the `RULES` array:

```typescript
import { noAnyTypeRule } from './rules/no-any-type.rule';

const RULES: Rule[] = [
  noCircularDepsRule,
  rxjsUnsubscribeRule,
  rxjsNestedSubscribeRule,
  largeBundleImportRule,
  missingOnPushRule,
  missingLazyLoadingRule,
  highCyclomaticComplexityRule,
  noAnyTypeRule, // add your rule here
];

```

That's it. The rule will now run on every analysis.

---

## Writing the Issue object

Each issue returned by a rule must follow this structure:


| Field        | Type     | Description                                         |
| ------------ | -------- | --------------------------------------------------- |
| `ruleId`     | `string` | Must match the rule's `id` field                    |
| `severity`   | `string` | Level of severity of the issue                      |
| `message`    | `string` | Specific description of the problem found           |
| `filePath`   | `string` | Absolute path to the file where the issue was found |
| `line`       | `number` | Line number where the issue starts                  |
| `impact`     | `string` | Why this matters in a real project                  |
| `suggestion` | `string` | Concrete, actionable fix                            |


**Severity guide:**

- `high` — can cause runtime errors, memory leaks or broken behaviour
- `medium` — degrades performance or maintainability
- `low` — style or convention issues with minor impact

---

## Writing tests for the rule

Every rule must have at least two tests: one for the case where the issue exists, and one where it does not. Tests live in `libs/analyzer/src/lib/rules/__tests__/`.

Create a file following this pattern:

```typescript
// libs/analyzer/src/lib/rules/__tests__/no-any-type.rule.spec.ts
import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { noAnyTypeRule } from '../no-any-type.rule';

function createContext(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.component.ts', code);
  return {
    project,
    sourceFiles: [sourceFile],
    projectPath: '/test',
  };
}

describe('noAnyTypeRule', () => {
  it('detects a property typed as any in a component', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        data: any;
      }
    `);

    const issues = noAnyTypeRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('no-any-type');
    expect(issues[0].severity).toBe('medium');
  });

  it('does not flag a properly typed property', () => {
    const context = createContext(`
      import { Component } from '@angular/core';

      @Component({ selector: 'app-test', template: '' })
      export class TestComponent {
        data: string[] = [];
      }
    `);

    const issues = noAnyTypeRule.run(context);
    expect(issues).toHaveLength(0);
  });
});

```

Run the tests:

```bash
pnpm nx test analyzer

```

---

## ts-morph reference

Rules use [ts-morph](https://ts-morph.com/) to traverse the AST. These are the most commonly used methods:


| Method                          | What it returns                        |
| ------------------------------- | -------------------------------------- |
| `sourceFile.getClasses()`       | All classes in the file                |
| `cls.getDecorator('Component')` | The `@Component` decorator, if present |
| `cls.getProperties()`           | All class properties                   |
| `cls.getMethods()`              | All class methods                      |
| `method.getStatements()`        | All statements inside a method         |
| `node.getStartLineNumber()`     | Line number of a node                  |
| `sourceFile.getFilePath()`      | Absolute path to the file              |
| `node.getText()`                | Raw source text of a node              |
| `node.getType().getText()`      | TypeScript type of a node as string    |


For more complex patterns, refer to the [ts-morph documentation](https://ts-morph.com/) or look at the existing rules in `libs/analyzer/src/lib/rules/` as reference.