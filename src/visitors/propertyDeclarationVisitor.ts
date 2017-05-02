import * as ts from 'typescript';
import * as nv from './nodeVisitor';
import * as psv from './propertySignatureVisitor';

export function create(saveCallback: (state: nv.IStateFieldData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.PropertyDeclaration;
        },
        visit: (n: ts.Node) => {
            let p = <ts.PropertyDeclaration>n;
            saveCallback({
                name: p.name.getText(),
                type: psv.getType(p.type)
            });
        }
    }
}