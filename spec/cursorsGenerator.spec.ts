import * as g from '../src/cursorsGenerator';
import * as gb from '../src/generator';
import * as ts from 'typescript';
import * as fs from "fs";
import * as pathPlatformDependent from 'path';
const path = pathPlatformDependent.posix;

describe('cursorsGenerator', () => {
    beforeEach(() => {
    });

    it('imports bobflux as node module', (done) => {
        g.default(aProject('stateWithBaseTypes.ts', (filename: string, b: Buffer) => {
            let cursors = b.toString('utf8');
            expect(cursors).toEqual(`import * as bf from 'bobflux';
import * as s from './state';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}

export let numberValueCursor: bf.ICursor<number> = {
    key: 'numberValue'
}
`);
            done();
        })).run();
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