import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateFieldData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.PropertySignature;
        },
        visit: (n: ts.Node) => {
            let ps = <ts.PropertySignature>n;
            if (ps.type.kind === ts.SyntaxKind.TypeReference)
                saveCallback({ name: ps.name.getText(), type: (<ts.TypeReferenceNode>ps.type).typeName.getText(), isState: true });
            else if (ps.type.kind === ts.SyntaxKind.ArrayType)
                saveCallback({ name: ps.name.getText(), type: (<ts.ArrayTypeNode>ps.type).elementType.getText(), isArray: true });
            else if (ps.type.kind === ts.SyntaxKind.TypeLiteral)
                saveCallback({ name: ps.name.getText(), type: (<ts.TypeLiteralNode>ps.type).getText() });
            else
                saveCallback({ name: ps.name.getText(), type: ts.tokenToString(ps.type.kind) });
        }
    }
}