import * as g from './generator';
import * as log from './logger';
import * as ts from 'typescript';
import * as pathPlatformDependent from 'path';

import * as bv from './visitors/bfgVisitor';

export * from './visitors/bfgVisitor';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export const resolvePathStringLiteral = ((nn: ts.StringLiteral) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));

export interface ITsAnalyzer {
    getSourceData: (source: ts.SourceFile, tc: ts.TypeChecker) => bv.IStateSourceData;
}

export let create = (logger: log.ILogger): ITsAnalyzer => {
    return {
        getSourceData: (source: ts.SourceFile, tc: ts.TypeChecker): bv.IStateSourceData => {
            var result: bv.IStateSourceData = {
                sourceFile: source,
                sourceDeps: [],
                filePath: null,
                fileName: null,
                states: [],
                imports: [],
                enums: [],
                customTypes: [],
                fluxImportAlias: null
            };
            let currentImport: bv.IImportData = null;
            let bvVisitor = bv.createAllBfgVisitors(() => result);

            function visit(n: ts.Node) {
                bvVisitor.accept(n) && bvVisitor.visit(n);

                if (n.kind === ts.SyntaxKind.StringLiteral) { //9
                    let sl = <ts.StringLiteral>n;
                    logger.debug('StringLiteral: ', sl);
                    if (currentImport) {
                        currentImport.relativePath = sl.text;
                        currentImport.fullPath = resolvePathStringLiteral(sl);
                    }
                }
                if (n.kind === ts.SyntaxKind.Identifier) { //69
                    let iden = <ts.Identifier>n;
                    logger.debug('Identifier: ', iden);
                }
                if (n.kind === ts.SyntaxKind.SourceFile) { // 249
                    let sf = <ts.SourceFile>n;
                    logger.debug('Identifier: ', sf);
                    result.filePath = sf.path;
                    result.fileName = path.basename(sf.fileName, '.ts');
                }
                if (n.kind === ts.SyntaxKind.ImportDeclaration) { //223
                    let im = <ts.ImportDeclaration>n;
                    logger.debug('ImportDeclaration: ', im);
                    if (currentImport)
                        result.imports.push(currentImport);
                    currentImport = { prefix: null, relativePath: null, fullPath: null };
                }
                if (n.kind === ts.SyntaxKind.ImportClause) { //224
                    let ic = <ts.ImportClause>n;
                    logger.debug('ImportClause: ', ic);
                }
                if (n.kind === ts.SyntaxKind.NamespaceImport) { //225
                    let ni = <ts.NamespaceImport>n;
                    logger.debug('NamespaceImport: ', ni);
                    currentImport.prefix = ni.name.getText();
                }

                if (n.kind === ts.SyntaxKind.InterfaceDeclaration || n.kind === ts.SyntaxKind.ClassDeclaration) { //216, 215
                    if (currentImport) {
                        result.imports.push(currentImport);
                        currentImport = null;
                    }
                }
                else if (n.kind === ts.SyntaxKind.TypeReference) { //151
                    logger.debug('TypeReference: ', n);
                }
                ts.forEachChild(n, visit);
            }
            visit(source);
            logger.debug('Source result: ', result);
            return result;
        }
    }
};
