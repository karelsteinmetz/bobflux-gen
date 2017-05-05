import * as ts from 'typescript';
import * as nv from './nodeVisitor';
import * as tsa from '../tsAnalyzer';

export function create(saveCallback: (data: nv.IImportData) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.ImportDeclaration;
        },

        visit: (id: ts.ImportDeclaration) => {
            const bindings = id.importClause.namedBindings;
            const path = id.moduleSpecifier as any as ts.LiteralLikeNode;
            if (isNamespaceImport(bindings)) {
                saveCallback({
                    prefix: bindings.name.text,
                    relativePath: path.text,
                    fullPath: tsa.resolvePathStringLiteral(path),
                    types: []
                })
            } else {
                saveCallback({
                    prefix: null,
                    relativePath: path.text,
                    fullPath: tsa.resolvePathStringLiteral(path),
                    types: bindings.elements.map(is => {
                        return {
                            targetType: is.name.text,
                            sourceType: (is.propertyName || is.name).text
                        }
                    })
                })
            }
        }
    }
}

function isNamespaceImport(ni: ts.NamedImportBindings): ni is ts.NamespaceImport {
    return 'name' in ni;
}