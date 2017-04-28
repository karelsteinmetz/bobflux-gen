import * as g from './generator';
import * as log from './logger';
import * as ts from 'typescript';
import * as pathPlatformDependent from 'path';

import * as bv from './visitors/bfgVisitor';

export * from './visitors/bfgVisitor';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export const resolvePathStringLiteral = ((nn: ts.LiteralLikeNode) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));

export interface ITsAnalyzer {
    getSourceData: (source: ts.SourceFile, tc: ts.TypeChecker) => bv.IStateSourceData;
}

export let create = (logger: log.ILogger): ITsAnalyzer => {
    return {
        getSourceData: (source: ts.SourceFile, tc: ts.TypeChecker): bv.IStateSourceData => {
            var result: bv.IStateSourceData = {
                sourceFile: source,
                sourceDeps: {},
                filePath: null,
                fileName: null,
                states: [],
                imports: [],
                enums: [],
                customTypes: [],
            };
            let bvVisitor = bv.createAllBfgVisitors(() => result);

            function visit(n: ts.Node, deepness: number) {
                logger.debug(`${' '.repeat(deepness)}${ts.SyntaxKind[n.kind]}: ${n.getText().substr(0, 70)}`);

                bvVisitor.accept(n) && bvVisitor.visit(n);

                ts.forEachChild(n, (node) => visit(node, deepness + 1));
            }
            visit(source, 0);
            updateSourceDeps(result);
            logger.debug('Source result: ', result);
            return result;
        }
    }
};

function updateSourceDeps(data: bv.IStateSourceData) {
    data.imports.forEach(i => {
        if (i.prefix)
            data.sourceDeps[i.prefix] = i;
        else
            i.prefix = createUnusedAlias(path.basename(i.relativePath), data.imports);
        i.types.forEach(t => {
            data.sourceDeps[t.targetType] = i;
        });
    });
}

export function createUnusedAlias(key: string, imports: bv.IImportData[]): string {
    let counter = 1;
    const keyBase = key.replace(/\W/g, '_');
    key = keyBase;
    while (imports.find(i => i.prefix === key)) {
        key = keyBase + counter++;
    }
    return key;
}
