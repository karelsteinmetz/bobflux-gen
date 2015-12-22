import * as g from '../src/cursorsGenerator';
import * as gb from '../src/generator';
import * as ts from 'typescript';
import * as fs from "fs";
import * as pathPlatformDependent from 'path';
const path = pathPlatformDependent.posix;

describe('cursorsGenerator', () => {
    let testCase: { do: () => Promise<string> };
    describe('stateWithNestedState', () => {
        beforeEach(() => {
            testCase = {
                do: () => new Promise<string>((f, r) => {
                    g.default(aProject('stateWithNestedState.ts', (filename: string, b: Buffer) => {
                        f(b.toString('utf8'));
                    })).run();
                })
            };
        });

        it('imports bobflux as node module', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[0]).toBe(`import * as bf from 'bobflux';`);
                    done();
                });
        });

        it('imports related state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[1]).toBe(`import * as s from './stateWithNestedState.ts';`);
                    done();
                });
        });
        
        it('generates main appCursor and typed it', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[3]).toBe(`export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor`);
                    done();
                });
        });
        
        it('prints current state', (done) => {
            testCase
                .do()
                .then(text => {
                    console.log(text);
                    done();
                });
        });
    });

    describe('stateWithBaseTypes', () => {
        beforeEach(() => {
            testCase = {
                do: () => new Promise<string>((f, r) => {
                    g.default(aProject('stateWithBaseTypes.ts', (filename: string, b: Buffer) => {
                        f(b.toString('utf8'));
                    })).run();
                })
            };
        });

        it('imports bobflux as node module', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[0]).toBe(`import * as bf from 'bobflux';`);
                    done();
                });
        });

        it('imports related state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[1]).toBe(`import * as s from './stateWithBaseTypes.ts';`);
                    done();
                });
        });

        it('generates main appCursor and typed it', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[3]).toBe(`export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor`);
                    done();
                });
        });

        it('generates state with base types', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toEqual(`import * as bf from 'bobflux';
import * as s from './stateWithBaseTypes.ts';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}

export let numberValueCursor: bf.ICursor<number> = {
    key: 'numberValue'
}
`);
                    done();
                });

        });
    });

    function aProject(appStateName: string, writeFileCallback: (filename: string, b: Buffer) => void): gb.IGenerationProject {
        return {
            dir: __dirname,
            appStateName: appStateName,
            appSourcesDirectory: path.join(__dirname, 'resources'),
            tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
            writeFileCallback: writeFileCallback
        }
    }
});