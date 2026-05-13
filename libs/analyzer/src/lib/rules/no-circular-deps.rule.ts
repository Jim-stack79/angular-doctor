import { SourceFile } from 'ts-morph';
import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

export const noCircularDepsRule: Rule = {
  id: 'no-circular-deps',
  name: 'No Circular Dependencies',
  description: 'Modules should not have circular dependencies between them',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    // Construimos el grafo: cada archivo -> lista de archivos que importa
    const graph = buildImportGraph(sourceFiles);

    // Buscamos ciclos en el grafo
    const visited = new Set<string>();
    const reportedCycles = new Set<string>();

    for (const filePath of graph.keys()) {
      const cycle = findCycle(filePath, graph, []);
      if (cycle) {
        // Normalizamos la clave del ciclo para no reportar el mismo dos veces
        const cycleKey = [...cycle].sort().join('->');
        if (!reportedCycles.has(cycleKey)) {
          reportedCycles.add(cycleKey);
          issues.push({
            ruleId: 'no-circular-deps',
            severity: 'high',
            message: `Circular dependency detected: ${cycle.join(' → ')}`,
            filePath: cycle[0],
            impact: 'Circular dependencies cause unpredictable runtime errors and make the codebase harder to maintain',
            suggestion: 'Extract the shared logic into a separate module that both files can import',
          });
        }
      }
      visited.add(filePath);
    }

    return issues;
  },
};

function buildImportGraph(sourceFiles: SourceFile[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const filePathSet = new Set(sourceFiles.map((sf) => sf.getFilePath()));

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const imports: string[] = [];

    for (const importDecl of sourceFile.getImportDeclarations()) {
      const referencedFile = importDecl.getModuleSpecifierSourceFile();
      if (referencedFile) {
        const referencedPath = referencedFile.getFilePath();
        // Solo incluimos imports que apuntan a archivos del proyecto
        if (filePathSet.has(referencedPath)) {
          imports.push(referencedPath);
        }
      }
    }

    graph.set(filePath, imports);
  }

  return graph;
}

function findCycle(
  start: string,
  graph: Map<string, string[]>,
  path: string[]
): string[] | null {
  if (path.includes(start)) {
    // Encontramos un ciclo — devolvemos solo el ciclo, no el path completo
    return path.slice(path.indexOf(start));
  }

  const neighbors = graph.get(start) ?? [];
  for (const neighbor of neighbors) {
    const cycle = findCycle(neighbor, graph, [...path, start]);
    if (cycle) return cycle;
  }

  return null;
}