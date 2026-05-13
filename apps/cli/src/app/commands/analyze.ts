import { Command } from 'commander';
import chalk, { type ChalkInstance } from 'chalk';import ora from 'ora';
import { resolve } from 'path';
import { analyzeProject } from '@myorg/analyzer';
import type { Issue } from '@myorg/analyzer';

export function registerAnalyzeCommand(program: Command): void {
  program
    .command('analyze <projectPath>')
    .description('Analyze an Angular project and report issues')
    .option('--json', 'Output results as JSON')
    .action(async (projectPath: string, options: { json?: boolean }) => {
      const absolutePath = resolve(projectPath);
      const spinner = ora(`Analyzing ${absolutePath}...`).start();

      try {
        const result = await analyzeProject(absolutePath);
        spinner.succeed(`Analysis complete — ${result.issues.length} issues found`);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        printReport(result.issues, absolutePath);
      } catch (err) {
        spinner.fail('Analysis failed');
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}

function printReport(issues: Issue[], projectPath: string): void {
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

function printIssue(issue: Issue, color: ChalkInstance): void {
    console.log(color(`  [${issue.ruleId}] ${issue.message}`));
  console.log(chalk.dim(`  File: ${issue.filePath}${issue.line ? `:${issue.line}` : ''}`));
  console.log(chalk.dim(`  Impact: ${issue.impact}`));
  console.log(chalk.dim(`  Fix: ${issue.suggestion}`));
  console.log();
}