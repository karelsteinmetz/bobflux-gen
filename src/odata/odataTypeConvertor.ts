import * as ts from 'typescript';

export function EdmInt32ToTs(odataType: string): ts.SyntaxKind {
    switch (odataType) {
        case 'Edm.Int32':
            return ts.SyntaxKind.NumberKeyword;
        case 'Edm.String':
            return ts.SyntaxKind.StringKeyword;
        case 'Edm.DateTimeOffset':
            return ts.SyntaxKind.StringKeyword;
        default:
            return ts.SyntaxKind.AnyKeyword;
    }
}