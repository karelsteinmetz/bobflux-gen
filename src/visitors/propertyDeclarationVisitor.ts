import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateFieldData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.PropertyDeclaration;
        },
        visit: (n: ts.Node) => {
            let p = <ts.PropertyDeclaration>n;
            if (p.type.kind === ts.SyntaxKind.TypeReference) {
                let tp = (<ts.TypeReferenceNode>p.type);
                saveCallback({
                    name: p.name.getText(),
                    type: tp.typeName.getText(),
                    isState: true,
                    typeArguments: tp.typeArguments && tp.typeArguments.map(tp => tp.getText())
                });
            }
            else if (p.type.kind === ts.SyntaxKind.ArrayType)
                saveCallback({ name: p.name.getText(), type: (<ts.ArrayTypeNode>p.type).elementType.getText(), isArray: true });
            else if (p.type.kind === ts.SyntaxKind.TypeLiteral)
                saveCallback({ name: p.name.getText(), type: (<ts.TypeLiteralNode>p.type).getText() });
            else
                saveCallback({ name: p.name.getText(), type: ts.tokenToString(p.type.kind) });
        }
    }
}