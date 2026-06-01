import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

import * as fs from 'fs';
import * as path from 'path';

const LARGE_COLLECTION_NAMES = [
  'users',
  'products',
  'orders',
  'customers',
  'messages',
  'notifications',
  'items',
  'records',
  'results',
  'rows',
  'data',
];

export const missingTrackByRule: Rule = {
  id: 'missing-trackby',
  name: 'Missing TrackBy',
  description:
    'Detects Angular ngFor and @for loops that do not use trackBy/track, which can cause unnecessary DOM re-renders',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const cls of classes) {
        const componentDecorator = cls.getDecorator('Component');

        if (!componentDecorator) continue;

        const template = getTemplateContent(
          componentDecorator.getText(),
          sourceFile.getFilePath()
        );

        if (!template) continue;

        const detectedIssues = [
          ...analyzeNgFor(template, cls, sourceFile),
          ...analyzeAtFor(template, cls, sourceFile),
        ];

        issues.push(...detectedIssues);
      }
    }

    return issues;
  },
};

function analyzeNgFor(
  template: string,
  cls: any,
  sourceFile: any
): Issue[] {
  const issues: Issue[] = [];

  const ngForMatches =
    template.match(/\*ngFor\s*=\s*"[^"]*"/g) || [];

  for (const ngFor of ngForMatches) {
    if (ngFor.includes('trackBy')) {
      continue;
    }

    const collectionName = extractNgForCollectionName(ngFor);

    if (
      collectionName &&
      isClearlyStaticCollection(cls, collectionName)
    ) {
      continue;
    }

    issues.push({
      ruleId: 'missing-trackby',
      severity: determineSeverity(collectionName),
      message: collectionName
        ? `Component "${cls.getName()}" iterates over "${collectionName}" using *ngFor without trackBy`
        : `Component "${cls.getName()}" contains an *ngFor without trackBy`,
      filePath: sourceFile.getFilePath(),
      line: cls.getStartLineNumber(),
      impact:
        'Angular may recreate DOM elements unnecessarily when collection references change, causing avoidable rendering work and degraded performance.',
      suggestion:
        'Add a trackBy function to the *ngFor directive so Angular can efficiently identify items between renders.',
    });
  }

  return issues;
}

function analyzeAtFor(
  template: string,
  cls: any,
  sourceFile: any
): Issue[] {
  const issues: Issue[] = [];

  const atForMatches =
    template.match(/@for\s*\(([^)]*)\)/g) || [];

  for (const atFor of atForMatches) {
    if (/\btrack\b/.test(atFor)) {
      continue;
    }

    const collectionName = extractAtForCollectionName(atFor);

    if (
      collectionName &&
      isClearlyStaticCollection(cls, collectionName)
    ) {
      continue;
    }

    issues.push({
      ruleId: 'missing-trackby',
      severity: determineSeverity(collectionName),
      message: collectionName
        ? `Component "${cls.getName()}" iterates over "${collectionName}" using @for without track`
        : `Component "${cls.getName()}" uses @for without track`,
      filePath: sourceFile.getFilePath(),
      line: cls.getStartLineNumber(),
      impact:
        'Without a track expression, Angular may recreate DOM nodes unnecessarily during updates, reducing rendering efficiency.',
      suggestion:
        'Add a track expression to the @for block, for example: @for (item of items; track item.id)',
    });
  }

  return issues;
}

function getTemplateContent(
  decoratorText: string,
  sourceFilePath: string
): string | null {
  const inlineTemplateMatch =
    decoratorText.match(
      /template\s*:\s*`([\s\S]*?)`/
    );

  if (inlineTemplateMatch) {
    return inlineTemplateMatch[1];
  }

  const templateUrlMatch =
    decoratorText.match(
      /templateUrl\s*:\s*['"](.+?)['"]/
    );

  if (!templateUrlMatch) {
    return null;
  }

  try {
    const templatePath = path.resolve(
      path.dirname(sourceFilePath),
      templateUrlMatch[1]
    );

    if (!fs.existsSync(templatePath)) {
      return null;
    }

    return fs.readFileSync(templatePath, 'utf8');
  } catch {
    return null;
  }
}

function extractNgForCollectionName(
  ngForExpression: string
): string | null {
  const match =
    ngForExpression.match(
      /of\s+([a-zA-Z0-9_$]+)/
    );

  return match?.[1] ?? null;
}

function extractAtForCollectionName(
  atForExpression: string
): string | null {
  const match =
    atForExpression.match(
      /of\s+([a-zA-Z0-9_$]+)/
    );

  return match?.[1] ?? null;
}

function determineSeverity(
  collectionName: string | null
): 'high' | 'medium' | 'low' {
  if (!collectionName) {
    return 'medium';
  }

  if (
    LARGE_COLLECTION_NAMES.includes(
      collectionName.toLowerCase()
    )
  ) {
    return 'high';
  }

  return 'medium';
}

function isClearlyStaticCollection(
  cls: any,
  collectionName: string
): boolean {
  const property = cls
    .getProperties()
    .find(
      (p: any) =>
        p.getName() === collectionName
    );

  if (!property) {
    return false;
  }

  const text = property.getText();

  const isReadonly =
    text.includes('readonly');

  const hasLiteralArray =
    /\[[\s\S]*\]/.test(text);

  return isReadonly && hasLiteralArray;
}