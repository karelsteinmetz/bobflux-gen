import * as ts from 'typescript';
import * as nv from './nodeVisitor';

export function create(saveCallback: (state: nv.IStateFieldData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.PropertySignature;
        },
        visit: (n: ts.Node) => {
            let ps = <ts.PropertySignature>n;
            saveCallback({
                name: ps.name.getText(),
                type: getType(ps.type)
            });
        }
    }
}

export function getType(type: ts.TypeNode): nv.ITypeData[] {
    if (type.kind == ts.SyntaxKind.UnionType) {
        let unionType = <ts.UnionTypeNode>type;
        return unionType.types.reduce((c, t) => c.concat(getType(t)), []);
    } else if (type.kind === ts.SyntaxKind.TypeReference) {
        let tp = (<ts.TypeReferenceNode>type);
        return [{
            name: tp.typeName.getText(),
            arguments: tp.typeArguments && tp.typeArguments.map(tp => getType(tp))
        }];
    }
    else if (type.kind === ts.SyntaxKind.ArrayType)
        return [{
            name: (<ts.ArrayTypeNode>type).elementType.getText(),
            isArray: true
        }];
    else if (type.kind === ts.SyntaxKind.TypeLiteral) {
        const tlType = <ts.TypeLiteralNode>type;
        if (tlType.members[0].kind === ts.SyntaxKind.IndexSignature) {
            const is = <ts.IndexSignatureDeclaration>tlType.members[0];
            if (is.type.kind === ts.SyntaxKind.TypeReference) {
                const tr = <ts.TypeReferenceNode>is.type;
                return [{
                    name: tr.typeName.getText(),
                    arguments: tr.typeArguments && tr.typeArguments.map(tp => getType(tp)),
                    indexer: is.parameters[0].getText()
                }];
            } else
                return [{
                    name: is.type.getText(),
                    indexer: is.parameters[0].getText()
                }];
        } else
            return [{
                name: tlType.getText()
            }];
    }
    else
        return [{
            name: ts.tokenToString(type.kind)
        }];

}