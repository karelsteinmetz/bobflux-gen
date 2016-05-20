import * as ts from 'typescript';
import * as nv from './nodeVisitor';

const code = 218;

export function create(saveCallback: (state: nv.IEnumData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.EnumDeclaration;
        },
        visit: (n: ts.Node) => {
            let en = <ts.EnumDeclaration>n;
            saveCallback({ name: en.name.getText() });
        }
    }
}