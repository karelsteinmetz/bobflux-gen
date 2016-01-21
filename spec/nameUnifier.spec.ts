import * as nu from '../src/nameUnifier';

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
});