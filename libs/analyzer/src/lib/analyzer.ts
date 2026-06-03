import { AnalysisResult, Issue, Severity } from './types';
import { createProject, getAngularSourceFiles } from './file-reader';
import { Rule, RuleContext } from './rules/rule.interface';
import { missingOnPushRule } from './rules/missing-onpush.rule';
import { missingLazyLoadingRule } from './rules/missing-lazy-loading.rule';
import { noCircularDepsRule } from './rules/no-circular-deps.rule';
import { highCyclomaticComplexityRule } from './rules/high-cyclomatic-complexity.rule';
import { rxjsUnsubscribeRule } from './rules/rxjs-unsubscribe.rule';
import { rxjsNestedSubscribeRule } from './rules/rxjs-nested-subscribe.rule';
import { largeBundleImportRule } from './rules/large-bundle-import.rule';
import { noAnyTypeRule } from './rules/no-any-type.rule';
import { missingTrackByRule } from './rules/missing-trackby.rule';
import { largeComponentRule } from './rules/large-component.rule';
import { directDomManipulationRule } from './rules/direct-dom-manipulation.rule';

const RULES: Rule[] = [
  noCircularDepsRule,
  rxjsUnsubscribeRule,
  rxjsNestedSubscribeRule,
  largeBundleImportRule,
  missingOnPushRule,
  missingLazyLoadingRule,
  highCyclomaticComplexityRule,
  noAnyTypeRule,
  missingTrackByRule,
  largeComponentRule,
  directDomManipulationRule
];

const SEVERITY_ORDER: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export async function analyzeProject(projectPath: string): Promise<AnalysisResult> {
  const project = createProject(projectPath);
  const sourceFiles = getAngularSourceFiles(project);

  const context: RuleContext = { project, sourceFiles, projectPath };

  const issues: Issue[] = [];
  for (const rule of RULES) {
    issues.push(...rule.run(context));
  }

  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    projectPath,
    analyzedAt: new Date(),
    issues,
    summary: {
      total: issues.length,
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
    },
  };
}