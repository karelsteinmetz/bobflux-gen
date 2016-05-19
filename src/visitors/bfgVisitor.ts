import * as ts from 'typescript';
import * as nv from './nodeVisitor';
import * as cv from './classDeclarationVisitor';
import * as iv from './interfaceDeclarationVisitor';
import * as pdv from './propertyDeclarationVisitor';
import * as psv from './propertyDeclarationVisitor';

export * from './nodeVisitor';

export function createAllBfgVisitors(saveCallback: () => nv.IStateSourceData) {
    return createBfgVisitor(
        cv.create((s) => { saveCallback().states.push(s); }),
        pdv.create((f) => {
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