import { Project, SourceFile } from 'ts-morph';
import { Issue } from '../types';

export interface RuleContext {
  project: Project;
  sourceFiles: SourceFile[];
  projectPath: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  run(context: RuleContext): Issue[];
}