import { Project } from 'ts-morph';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

export function createProject(projectPath: string): Project {
  const tsConfigPath = resolveTsConfigPath(projectPath);

  return new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
    skipFileDependencyResolution: true,
  });
}

function resolveTsConfigPath(projectPath: string): string {
  const rootTsConfig = join(projectPath, 'tsconfig.json');

  if (!existsSync(rootTsConfig)) {
    throw new Error(`No tsconfig.json found at ${projectPath}`);
  }

  // Si el tsconfig raíz tiene files:[] y usa references (patrón Angular),
  // usamos tsconfig.app.json que es donde están los archivos reales
  try {
    const content = readFileSync(rootTsConfig, 'utf-8');
    // Eliminamos comentarios antes de parsear
    const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    const parsed = JSON.parse(cleaned);

    const hasEmptyFiles = Array.isArray(parsed.files) && parsed.files.length === 0;
    const hasReferences = Array.isArray(parsed.references) && parsed.references.length > 0;

    if (hasEmptyFiles && hasReferences) {
      const appTsConfig = join(projectPath, 'tsconfig.app.json');
      if (existsSync(appTsConfig)) {
        return appTsConfig;
      }
    }
  } catch {
    // Si no podemos parsear el tsconfig, usamos el raíz
  }

  return rootTsConfig;
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