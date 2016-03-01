import * as pu from '../src/pathUtils';
import * as path from 'path';

describe('pathUtils', () => {
    describe('normalizePath', () => {
        it('relative path', () => {
            expect(pu.normalizePath('', 'appPart/state.ts', './some.ts')).toBe('appPart\\some.ts');
        });

        it('relative path without base', () => {
            expect(pu.normalizePath(null, 'appPart/state.ts', './some.ts')).toBe('appPart\\some.ts');
        });

        it('absolute path', () => {
            expect(pu.normalizePath('c:/app', 'c:/app/appPart/state.ts', './some.ts')).toBe('appPart\\some.ts');
        });
    })

    describe('resolveRelatioveStateFilePath', () => {
        it('absolute path', () => {
            expect(pu.resolveRelatioveStateFilePath('c:/app/appPart/', 'c:/app/some')).toBe('..\\some');
        });
    })
    
    describe('createBuildersFilePath', () => {
        it('creates path for root state builders', () => {
            expect(pu.createBuildersFilePath('c:/app/src/', 'c:/app/spec', 'c:/app/src/state.ts')).toBe('c:\\app\\spec\\state.builders.ts');
        });
        
        it('creates path for relative state builders', () => {
            expect(pu.createBuildersFilePath('c:/app/src/', 'c:/app/spec', 'c:/app/src/todos/state.ts')).toBe('c:\\app\\spec\\todos\\state.builders.ts');
        });
    })
    
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

        it('gets relative', () => {
            expect(path.resolve('c:/dev-github/bobflux-gen/spec/resources/', '../../tests/')).toBe('c:\\dev-github\\bobflux-gen\\tests');
        });
    });
});