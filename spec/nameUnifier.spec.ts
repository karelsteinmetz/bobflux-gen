import * as nu from '../src/nameUnifier';
import * as pathPlatformDependent from 'path';
import * as path from 'path';

describe('nameUnifier', () => {
    describe('getStateName', () => {
        it('generates cursors for todos', () => {
            expect(nu.getStatePrefixFromKeyPrefix('some.prefix', 'propertyName'))
                .toBe('somePrefixPropertyName');
        });
    });

    describe('removeIfacePrefix', () => {
        it('removes prefix', () => {
            expect(nu.removeIfacePrefix('IAppState', 'I'))
                .toBe('AppState');
        });
    });

    describe('removePostfix', () => {
        it('removes postfix', () => {
            expect(nu.removePostfix('IAppState', 'State'))
                .toBe('IApp');
        });

        it('removes postfix on the end', () => {
            expect(nu.removePostfix('IStateAppState', 'State'))
                .toBe('IStateApp');
        });
    });

    describe('createDom', () => {
        it('creates dom from cursor key', () => {
            expect(nu.createDomString('some.state.key', 'this.state'))
                .toEqual(`{ some: { state: { key: this.state } } }`);
        });
    });
});