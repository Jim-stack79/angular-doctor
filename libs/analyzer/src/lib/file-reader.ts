import { Project } from 'ts-morph';
import { join } from 'path';
import { existsSync } from 'fs';

export function createProject(projectPath: string): Project {
  const tsConfigPath = join(projectPath, 'tsconfig.json');

  if (!existsSync(tsConfigPath)) {
    throw new Error(`No tsconfig.json found at ${projectPath}`);
  }

  return new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
    skipFileDependencyResolution: true,
  });
}

export function getAngularSourceFiles(project: Project) {
  return project.getSourceFiles().filter((sf) => {
    const path = sf.getFilePath();
    return (
      !path.includes('node_modules') &&
      !path.includes('.spec.') &&
      !path.includes('dist/')
    );
  });
}