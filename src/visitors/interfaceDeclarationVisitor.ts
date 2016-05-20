import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.InterfaceDeclaration;
        },
        visit: (n: ts.Node) => {
            let ce = <ts.InterfaceDeclaration>n;
            saveCallback({
                typeName: ce.name.text,
                type: ce.kind,
                fileName: (<ts.SourceFile>ce.parent).fileName,
                fields: [],
                heritages: ce.heritageClauses ? ce.heritageClauses.map(h => h.types.map(t => t.getText()).join(';')) : [],
                source: nv.StateSource.cls
            });
        }
    }
}