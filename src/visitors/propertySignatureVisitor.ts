import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateFieldData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.PropertySignature;
        },
        visit: (n: ts.Node) => {
            let ps = <ts.PropertySignature>n;
            if (ps.type.kind === ts.SyntaxKind.TypeReference) {
                let tp = (<ts.TypeReferenceNode>ps.type);
                saveCallback({
                    name: ps.name.getText(),
                    type: tp.typeName.getText(),
                    isState: true,
                    typeArguments: tp.typeArguments && tp.typeArguments.map(tp => tp.getText())
                });
            }
            else if (ps.type.kind === ts.SyntaxKind.ArrayType)
                saveCallback({ name: ps.name.getText(), type: (<ts.ArrayTypeNode>ps.type).elementType.getText(), isArray: true });
            else if (ps.type.kind === ts.SyntaxKind.TypeLiteral) {
                const tlType = <ts.TypeLiteralNode>ps.type;
                if (tlType.members[0].kind === ts.SyntaxKind.IndexSignature) {
                    const is = <ts.IndexSignatureDeclaration>tlType.members[0];
                    saveCallback({ name: ps.name.getText(), type: is.type.getText(), indexer: is.parameters[0].getText() })
                } else
                    saveCallback({ name: ps.name.getText(), type: tlType.getText() });
            }
            else
                saveCallback({ name: ps.name.getText(), type: ts.tokenToString(ps.type.kind) });
        }
    }
}