import * as ts from 'typescript';
import * as nv from './nodeVisitor';

const code = 217;
export function create(saveCallback: (state: nv.ICustomTypeData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.TypeAliasDeclaration;
        },
        visit: (n: ts.Node) => {
            saveCallback({ name: (<ts.TypeAliasDeclaration>n).name.getText() });
        }
    }
}