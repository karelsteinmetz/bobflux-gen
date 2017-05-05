import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.ClassDeclaration;
        },
        visit: (n: ts.Node) => {
            let cd = <ts.ClassDeclaration>n;
            saveCallback({
                typeName: cd.name.text,
                type: cd.kind,
                fileName: (<ts.SourceFile>cd.parent).fileName,
                fields: [],
                heritages: cd.heritageClauses ? nv.flatten(cd.heritageClauses.map(h => h.types.map(t => t.getText()))) : [],
                source: nv.StateSource.cls,
                typeArguments: cd.typeParameters && cd.typeParameters.map(tp => tp.getText())
            });
        }
    }
}