import * as g from '../src/cursorsGenerator';
import * as gb from '../src/generator';
import * as tsa from '../src/tsAnalyzer';
import * as log from '../src/logger';
import * as ts from 'typescript';
import * as fs from "fs";
import * as pathPlatformDependent from 'path';
const path = pathPlatformDependent.posix;

describe('cursorsGenerator', () => {
    let testCase: { do: () => Promise<string> };
    let logger = log.create(false, false, false, false);

    describe('auto-generated header', () => {
        beforeEach(() => {
            testCase = {
                do: () => new Promise<string>((f, r) => {
                    g.default(aProject('PointDto', './pointAndPosition.ts', (filename: string, b: Buffer) => {
                        if (filename.indexOf('pointAndPosition') !== -1)
                            f(b.toString('utf8'));
                    }), tsa.create(logger), logger).run();
                })
            };
        });
        
        it('adds file with state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
import * as s from './pointAndPosition';
`);
                    done();
                });
        });
        
        it('adds roots', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
export const rootKey = bf.rootCursor.key;

export const rootCursor: bf.ICursor<s.PointDto> = bf.rootCursor;

export default rootCursor;
`);
                    done();
                });
        });

        it('adds note', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
export const idCursor: bf.ICursor<string> = {
    key: 'id'
};
`);
                    done();
                });
        });
    });

    function aProject(appStateName: string, appFilePath: string, writeFileCallback: (filename: string, b: Buffer) => void, version: string = 'AVersion'): gb.IGenerationProject {
        return {
            version: version,
            dir: __dirname,
            appStateName: appStateName,
            appSourcesDirectory: path.join(__dirname, 'resources'),
            appStateFileName: path.basename(appFilePath),
            tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
            writeFileCallback: writeFileCallback
        }
    }
});