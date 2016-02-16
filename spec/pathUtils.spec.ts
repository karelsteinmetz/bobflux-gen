import * as pu from '../src/pathUtils';
import * as path from 'path';

describe('pathUtils', () => {
    it('relative path', () => {
        expect(pu.normalizePath('', 'appPart/state.ts', './some.ts')).toBe('appPart\\some.ts');
    });

    it('relative path without base', () => {
        expect(pu.normalizePath(null, 'appPart/state.ts', './some.ts')).toBe('appPart\\some.ts');
    });
    
    it('absolute path', () => {
        expect(pu.normalizePath('c:/app', 'c:/app/appPart/state.ts', './some.ts')).toBe('appPart\\some.ts');
    });
});