import * as ts from 'typescript';
import * as nv from './nodeVisitor';
import * as cv from './classDeclarationVisitor';
import * as iv from './interfaceDeclarationVisitor';
import * as pdv from './propertyDeclarationVisitor';
import * as psv from './propertySignatureVisitor';
import * as edv from './enumDeclarationVisitor';
import * as tadv from './typeAliasDeclarationVisitor';

export * from './nodeVisitor';

export function createAllBfgVisitors(saveCallback: () => nv.IStateSourceData) {
    return createBfgVisitor(
        edv.create(e => saveCallback().enums.push(e)),
        tadv.create(t => saveCallback().customTypes.push(t)),
        cv.create(s => saveCallback().states.push(s)),
        iv.create(s => saveCallback().states.push(s)),
        pdv.create(f => {
            let data = saveCallback();
            data.states[data.states.length - 1].fields.push(f);
        }),
        psv.create(f => {
            let data = saveCallback();
            data.states[data.states.length - 1].fields.push(f);
        })
    );
}

function createBfgVisitor(...visitors: nv.INodeVisitor[]): nv.INodeVisitor {
    let _visitors = visitors || [];

    return {
        accept: (n: ts.Node): boolean => {
            return _visitors.filter(v => v.accept(n)).length > 0;
        },
        visit: (n: ts.Node) => {
            let acceptedVisitor = _visitors.filter(v => v.accept(n))[0];
            acceptedVisitor.visit(n);
        }
    }
}