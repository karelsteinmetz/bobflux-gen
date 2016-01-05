import * as g from './generator';
import * as log from './logger';
import * as ts from 'typescript';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

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

export interface IImportData {
    prefix: string
    filePath: string
}

export interface IStateSourceData {
    sourceFile: ts.SourceFile
    sourceDeps: [string, string][]
    filePath: string
    fileName: string
    states: IStateData[],
    imports: IImportData[]
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
                states: [],
                imports: []
            };
            let currentImport: IImportData = null;

            function visit(n: ts.Node) {
                logger.debug('Visited kind: ', n.kind);
                if (n.kind === ts.SyntaxKind.StringLiteral) { //9
                    let sl = <ts.StringLiteral>n;
                    logger.debug('StringLiteral: ', sl);
                    if (currentImport)
                        currentImport.filePath = sl.text;
                }
                if (n.kind === ts.SyntaxKind.Identifier) { //69
                    let iden = <ts.Identifier>n;
                    logger.debug('Identifier: ', iden);
                }
                if (n.kind === ts.SyntaxKind.SourceFile) { // 249
                    let sf = <ts.SourceFile>n;
                    logger.debug('Identifier: ', sf);
                    result.filePath = sf.path;
                    result.fileName = path.basename(sf.fileName);
                }
                if (n.kind === ts.SyntaxKind.ImportDeclaration) { //223
                    let im = <ts.ImportDeclaration>n;
                    logger.debug('ImportDeclaration: ', im);
                    if (currentImport)
                        result.imports.push(currentImport);
                    currentImport = { prefix: null, filePath: null }
                }
                if (n.kind === ts.SyntaxKind.ImportClause) { //224
                    let ic = <ts.ImportClause>n;
                    logger.debug('ImportClause: ', ic);
                }
                if (n.kind === ts.SyntaxKind.NamespaceImport) { //225
                    let ni = <ts.NamespaceImport>n;
                    logger.debug('NamespaceImport: ', ni);
                    currentImport.prefix = ni.getText();
                }
                if (n.kind === ts.SyntaxKind.InterfaceDeclaration) { //216
                    let ce = <ts.InterfaceDeclaration>n;
                    result.states.push({
                        name: ce.name.text,
                        type: ce.kind,
                        fileName: (<ts.SourceFile>ce.parent).fileName,
                        fields: []
                    });
                    if (currentImport) {
                        result.imports.push(currentImport)
                        currentImport = null;
                    }
                }
                else if (n.kind === ts.SyntaxKind.TypeReference) { //151
                    logger.debug('TypeReference: ', n);
                }
                else if (n.kind === ts.SyntaxKind.PropertySignature) { //140
                    let ps = <ts.PropertySignature>n;
                    logger.debug('PropertySignature: ', ps);
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
