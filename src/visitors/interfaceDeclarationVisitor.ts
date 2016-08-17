import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.InterfaceDeclaration;
        },
        visit: (n: ts.Node) => {
            let id = <ts.InterfaceDeclaration>n;
            saveCallback({
                typeName: id.name.text,
                type: id.kind,
                fileName: (<ts.SourceFile>id.parent).fileName,
                fields: [],
                heritages: id.heritageClauses ? nv.flatten(id.heritageClauses.map(h => h.types.map(t => t.getText()))) : [],
                source: nv.StateSource.cls,
                typeArguments: id.typeParameters && id.typeParameters.map(tp => tp.getText())
            });
        }
    }
}