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

    describe('path playground', () => {
        it('creates relative path', () => {
            expect(path.relative('c:/app/src/', 'c:/app/spec/')).toBe('..\\spec');
        });

        it('creates relative path', () => {
            expect(path.relative('./app/src/', './app/spec/')).toBe('..\\spec');
        });

        it('joins absolute path and relative path', () => {
            expect(path.join('c:/app/src/', '../spec/')).toBe('c:\\app\\spec\\');
        });

        it('joins two relative path', () => {
            expect(path.join('./app/src/', '../spec/')).toBe('app\\spec\\');
        });

        it('gets directory', () => {
            expect(path.dirname('c:/app/app/src/state.ts')).toBe('c:/app/app/src');
        });
        
        it('gets relative from absolute paths', () => {
            expect(path.relative('c:\\app\\app\\src\\state.ts', 'c:/app/app/src/state.ts')).toBe('');
        });
                
        it('gets relative from relative paths', () => {
            expect(path.relative('app\\src\\state.ts', './app/src/state.ts')).toBe('');
        });
    });
});