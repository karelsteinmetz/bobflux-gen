import * as gb from '../src/generator';
import * as bg from '../src/buildersGenrator';
import * as tsa from '../src/tsAnalyzer';
import * as log from '../src/logger';
import * as ts from 'typescript';
import * as fs from "fs";
import * as pathPlatformDependent from 'path';
const path = pathPlatformDependent.posix;

describe('buildersGenrator', () => {
    let testCase: { do: () => Promise<string> };
    let logger = log.create(false, false, false, false);

    describe('file stateTodos', () => {
        beforeEach(() => {
            testCase = {
                do: () => new Promise<string>((f, r) => {
                    bg.default(aProject('IApplicationState', './stateTodos.ts', (filename: string, b: Buffer) => {
                        if (filename.indexOf('stateTodos') !== -1)
                            f(b.toString('utf8'));
                    }), tsa.create(logger), logger).run();
                })
            };
        });
                
        it('imports state file', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`import * as s from './stateTodos';`);
                    done();
                });
        });
        
        it('generates builder fields', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
    public withTodoSection(todoSection: s.ITodosState): ApplicationStateBuilder {
        this.state.todoSection = todoSection;
        return this;
    };
`);
                    done();
                });
        });
        
        it('generates build function for application state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
    public build(): s.IApplicationState {
        s.bootstrap(this.state);
        return this.state;
    }`);
                    done();
                });
        });
        
        it('generates build function for nested states', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
    public build(): s.ITodo {
        return this.state;
    }`);
                    done();
                });
        });
        
        it('generates builder for todos section', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
export class ApplicationStateBuilder {
    private state: s.IApplicationState = s.default();

    public withTodoSection(todoSection: s.ITodosState): ApplicationStateBuilder {
        this.state.todoSection = todoSection;
        return this;
    };

    public build(): s.IApplicationState {
        s.bootstrap(this.state);
        return this.state;
    }
}
`);
                    done();
                });
        });
    });
    
    function aProject(appStateName: string, appFilePath: string, writeFileCallback: (filename: string, b: Buffer) => void): gb.IGenerationProject {
        return {
            dir: __dirname,
            appStateName: appStateName,
            appSourcesDirectory: path.join(__dirname, 'resources'),
            appStateFileName: path.basename(appFilePath),
            tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
            writeFileCallback: writeFileCallback
        }
    }
});