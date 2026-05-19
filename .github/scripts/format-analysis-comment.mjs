import { readFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: format-analysis-comment.mjs <result.json>');
  process.exit(1);
}

const raw = readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

const issues = data.issues ?? [];

const high   = issues.filter(i => i.severity === 'high');
const medium = issues.filter(i => i.severity === 'medium');
const low    = issues.filter(i => i.severity === 'low');

const emoji = high.length > 0 ? '🔴' : medium.length > 0 ? '🟡' : '🟢';

const severityBadge = (s) => ({ high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' }[s] ?? s);

const formatIssue = (issue) =>
    `| ${severityBadge(issue.severity)} | \`${issue.filePath ?? '—'}\` | ${issue.message ?? '—'} |`;

const table = (list) => list.length === 0
  ? '_None_'
  : `| Severity | File | Issue |\n|---|---|---|\n${list.map(formatIssue).join('\n')}`;

const lines = [
  `## ${emoji} Angular Doctor Analysis`,
  '',
  `> **${issues.length} issue(s) found** — ${high.length} high · ${medium.length} medium · ${low.length} low`,
  '',
  '### 🔴 High severity',
  table(high),
  '',
  '### 🟡 Medium severity',
  table(medium),
  '',
  '### 🟢 Low severity',
  table(low),
  '',
  '---',
  `_Generado por Angular Doctor · ${new Date().toUTCString()}_`,
];

console.log(lines.join('\n'));