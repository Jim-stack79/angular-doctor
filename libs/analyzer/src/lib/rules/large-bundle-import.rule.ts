import { SyntaxKind } from 'ts-morph';
import { Rule, RuleContext } from './rule.interface';
import { Issue } from '../types';

// Librerías conocidas por tener imports pesados si se importan completas
const HEAVY_NAMESPACE_IMPORTS = [
  'lodash',
  'rxjs',
  'date-fns',
  'ramda',
  'moment',
  'underscore',
];

export const largeBundleImportRule: Rule = {
  id: 'large-bundle-import',
  name: 'Large Bundle Import',
  description: 'Avoid importing entire libraries when only specific parts are needed',

  run({ sourceFiles }: RuleContext): Issue[] {
    const issues: Issue[] = [];

    for (const sourceFile of sourceFiles) {
      // Detectar imports de namespace: import * as x from 'library'
      const namespaceImports = sourceFile
        .getImportDeclarations()
        .filter(imp => imp.getNamespaceImport() !== undefined);

      for (const imp of namespaceImports) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        const isHeavyLib = HEAVY_NAMESPACE_IMPORTS.some(lib =>
          moduleSpecifier === lib || moduleSpecifier.startsWith(`${lib}/`)
        );

        if (isHeavyLib) {
          issues.push({
            ruleId: 'large-bundle-import',
            severity: 'medium',
            message: `Namespace import of "${moduleSpecifier}" imports the entire library`,
            filePath: sourceFile.getFilePath(),
            line: imp.getStartLineNumber(),
            impact: 'Importing the entire library increases bundle size significantly',
            suggestion: `Use named imports instead: import { specificFunction } from '${moduleSpecifier}'`,
          });
        }
      }

      // Detectar import de moment sin alternativa (librería muy pesada)
      const momentImports = sourceFile
        .getImportDeclarations()
        .filter(imp => imp.getModuleSpecifierValue() === 'moment');

      for (const imp of momentImports) {
        issues.push({
          ruleId: 'large-bundle-import',
          severity: 'medium',
          message: `"moment" is a very heavy library (290kb minified)`,
          filePath: sourceFile.getFilePath(),
          line: imp.getStartLineNumber(),
          impact: 'moment adds ~290kb to the bundle. Most Angular projects can replace it with the built-in DatePipe or date-fns',
          suggestion: `Replace moment with Angular's DatePipe for templates, or date-fns for programmatic date manipulation`,
        });
      }
    }

    return issues;
  },
};