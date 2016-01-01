import * as g from './generator';
import * as log from './logger';
import * as ts from 'typescript';

export interface IStateFieldData {
    name: string
    type: string
    isState: boolean
}

export interface IStateData {
    name: string
    type: ts.SyntaxKind
    fileName: string
    fields: IStateFieldData[]
}

export interface IStateSourceData {
    sourceFile: ts.SourceFile
    sourceDeps: [string, string][]
    filePath: string
    fileName: string
    states: IStateData[]
}

export interface ITsAnalyzer {
    getSourceData: (source: ts.SourceFile, tc: ts.TypeChecker, resolvePathStringLiteral: (sl: ts.StringLiteral) => string) => IStateSourceData;
}

export let create = (logger: log.ILogger): ITsAnalyzer => {
    return {
        getSourceData: (source: ts.SourceFile, tc: ts.TypeChecker, resolvePathStringLiteral: (sl: ts.StringLiteral) => string): IStateSourceData => {
            var result: IStateSourceData = {
                sourceFile: source,
                sourceDeps: [],
                filePath: null,
                fileName: null,
                states: []
            };
            function visit(n: ts.Node) {
                logger.debug('Visited kind: ', n.kind);
                if (n.kind === ts.SyntaxKind.SourceFile) { // 249
                    let sf = <ts.SourceFile>n;
                    result.filePath = sf.path;
                    result.fileName = sf.fileName;
                }
                if (n.kind === ts.SyntaxKind.ImportDeclaration) { //223
                    let im = <ts.ImportDeclaration>n;
                    logger.debug('ImportDeclaration: ', im);
                }
                if (n.kind === ts.SyntaxKind.ImportClause) { //224
                    let ic = <ts.ImportClause>n;
                    logger.debug('ImportClause', ic);
                }
                else if (n.kind === ts.SyntaxKind.InterfaceDeclaration) { //216
                    let ce = <ts.InterfaceDeclaration>n;
                    result.states.push({
                        name: ce.name.text,
                        type: ce.kind,
                        fileName: (<ts.SourceFile>ce.parent).fileName,
                        fields: []
                    });
                }
                else if (n.kind === ts.SyntaxKind.TypeReference) { //151
                    logger.debug('TypeReference', n);
                }
                else if (n.kind === ts.SyntaxKind.PropertySignature) { //140
                    let ps = <ts.PropertySignature>n;
                    if (ps.parent.kind !== ts.SyntaxKind.InterfaceDeclaration)
                        throw 'Properties in Interfaces are only allowed.'
                    let iface = result.states.filter(s => s.name === (<ts.InterfaceDeclaration>ps.parent).name.text)[0];
                    if (ps.type.kind === ts.SyntaxKind.TypeReference)
                        iface.fields.push({ name: ps.name.getText(), type: (<ts.TypeReferenceNode>ps.type).typeName.getText(), isState: true })
                    else
                        iface.fields.push({ name: ps.name.getText(), type: ts.tokenToString(ps.type.kind), isState: false })
                }
                ts.forEachChild(n, visit);
            }
            visit(source);
            logger.debug('Source result: ', result);
            return result;
        }
    }
};
