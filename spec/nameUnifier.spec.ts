import * as nu from '../src/nameUnifier';
import * as pathPlatformDependent from 'path';

// const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes
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
});