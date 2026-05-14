import { Command } from 'commander';
import chalk, { type ChalkInstance } from 'chalk';
import ora from 'ora';
import { resolve } from 'path';

import { analyzeProject, explainIssue } from '@myorg/analyzer';
import type { Issue, IssueWithAI } from '@myorg/analyzer';

export function registerAnalyzeCommand(program: Command): void {
  program
    .command('analyze <projectPath>')
    .description('Analyze an Angular project and report issues')
    .option('--json', 'Output results as JSON')
    .option('--ai', 'Enrich results with AI explanations (requires Ollama running locally)')
    .action(async (projectPath: string, options: { json?: boolean; ai?: boolean }) => {
      const absolutePath = resolve(projectPath);
      const spinner = ora(`Analyzing ${absolutePath}...`).start();

      try {
        const result = await analyzeProject(absolutePath);
        spinner.succeed(`Analysis complete — ${result.issues.length} issues found`);

        let issues: IssueWithAI[] = result.issues;

        if (options.ai && result.issues.length > 0) {
          const aiSpinner = ora('Enriching results with AI explanations...').start();
          issues = await Promise.all(
            result.issues.map(async (issue) => ({
              ...issue,
              aiExplanation: await explainIssue(issue) ?? undefined,
            }))
          );
          aiSpinner.succeed('AI explanations ready');
        }

        if (options.json) {
          console.log(JSON.stringify({ ...result, issues }, null, 2));
          return;
        }

        printReport(issues, absolutePath);
      } catch (err) {
        spinner.fail('Analysis failed');
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}

function printReport(issues: IssueWithAI[], projectPath: string): void {
  console.log('\n' + chalk.bold('Angular Doctor — Analysis Report'));
  console.log(chalk.dim(projectPath));
  console.log(chalk.dim('─'.repeat(60)) + '\n');

  if (issues.length === 0) {
    console.log(chalk.green('✓ No issues found. Your project looks healthy!'));
    return;
  }

  const high = issues.filter((i) => i.severity === 'high');
  const medium = issues.filter((i) => i.severity === 'medium');
  const low = issues.filter((i) => i.severity === 'low');

  if (high.length > 0) {
    console.log(chalk.red.bold(`● HIGH (${high.length})`));
    high.forEach((i) => printIssue(i, chalk.red));
  }

  if (medium.length > 0) {
    console.log(chalk.yellow.bold(`● MEDIUM (${medium.length})`));
    medium.forEach((i) => printIssue(i, chalk.yellow));
  }

  if (low.length > 0) {
    console.log(chalk.blue.bold(`● LOW (${low.length})`));
    low.forEach((i) => printIssue(i, chalk.blue));
  }

  console.log('\n' + chalk.dim('─'.repeat(60)));
  console.log(
    chalk.bold('Summary: ') +
    chalk.red(`${high.length} high`) + '  ' +
    chalk.yellow(`${medium.length} medium`) + '  ' +
    chalk.blue(`${low.length} low`)
  );
}

function printIssue(issue: IssueWithAI, color: ChalkInstance): void {
  console.log(color(`  [${issue.ruleId}] ${issue.message}`));
  console.log(chalk.dim(`  File: ${issue.filePath}${issue.line ? `:${issue.line}` : ''}`));
  console.log(chalk.dim(`  Impact: ${issue.impact}`));
  console.log(chalk.dim(`  Fix: ${issue.suggestion}`));

  if (issue.aiExplanation) {
    console.log(chalk.cyan(`\n  🤖 AI Explanation:`));
    console.log(chalk.cyan(`  ${issue.aiExplanation.summary}`));
    console.log(chalk.cyan(`\n  Why it matters: ${issue.aiExplanation.whyItMatters}`));
    console.log(chalk.cyan(`\n  How to fix: ${issue.aiExplanation.howToFix}`));
    if (issue.aiExplanation.codeExample) {
      console.log(chalk.cyan(`\n  Example:\n  ${issue.aiExplanation.codeExample}`));
    }
  }

  console.log();
}