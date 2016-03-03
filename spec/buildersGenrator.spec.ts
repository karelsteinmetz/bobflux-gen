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

    describe('relative path', () => {
        describe('file stateWithInner', () => {
            beforeEach(() => {
                testCase = {
                    do: () => new Promise<string>((f, r) => {
                        bg.default(aProject('IApplicationState', './stateWithInner.ts', (filename: string, b: Buffer) => {
                            if (filename.replace(/\\/g, "/").indexOf('/tests/stateWithInner.builders.ts') !== -1)
                                f(b.toString('utf8'));
                        }, '../../tests/'), tsa.create(logger), logger).runRecurse();
                    })
                };
            })

            it('imports state file', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as ss from '../spec/resources/stateWithInner';`);
                        done();
                    });
            });
            
            it('imports external files', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as f from '../spec/flux';`);
                        done();
                    });
            });
        })

        describe('file stateInner', () => {
            beforeEach(() => {
                testCase = {
                    do: () => new Promise<string>((f, r) => {
                        bg.default(aProject('IApplicationState', './stateWithInner.ts', (filename: string, b: Buffer) => {
                            if (filename.replace(/\\/g, "/").indexOf('/tests/inner/stateInner.builders.ts') !== -1)
                                f(b.toString('utf8'));
                        }, '../../tests'), tsa.create(logger), logger).runRecurse();
                    })
                };
            })

            it('imports state file', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as s from '../../spec/resources/inner/stateInner';`);
                        done();
                    });
            });
            
            it('imports external files', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as f from '../../spec/flux';`);
                        done();
                    });
            });
        })
    })


    describe('stateWithExternalState', () => {
        describe('file stateWithExternalState', () => {
            beforeEach(() => {
                testCase = {
                    do: () => new Promise<string>((f, r) => {
                        bg.default(aProject('IApplicationState', './stateWithExternalState.ts', (filename: string, b: Buffer) => {
                            if (filename.indexOf('stateWithExternalState') !== -1)
                                f(b.toString('utf8'));
                        }), tsa.create(logger), logger).runRecurse();
                    })
                };
            })

            it('imports state file', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as s from './stateWithExternalState';`);
                        done();
                    });
            });

            it('imports external state file', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as ns from './stateWithNestedState';`);
                        done();
                    });
            });

            it('generates builder fields', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`
    public withStringValue(stringValue: string): ApplicationStateBuilder {
        this.state.stringValue = stringValue;
        return this;
    };

    public withBaseTypes(baseTypes: ns.INestedState): ApplicationStateBuilder {
        this.state.baseTypes = baseTypes;
        return this;
    };
`);
                        done();
                    });
            });
        })

        describe('file stateWithNestedState', () => {
            beforeEach(() => {
                testCase = {
                    do: () => new Promise<string>((f, r) => {
                        bg.default(aProject('IApplicationState', './stateWithExternalState.ts', (filename: string, b: Buffer) => {
                            if (filename.indexOf('stateWithNestedState') !== -1)
                                f(b.toString('utf8'));
                        }), tsa.create(logger), logger).runRecurse();
                    })
                };
            })

            it('imports state file', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toContain(`import * as s from './stateWithNestedState';`);
                        done();
                    });
            });
        })
    })

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
                })
                .catch(e => {
                    console.log(e);
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
        f.bootstrap(this.state);
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
        f.bootstrap(this.state);
        return this.state;
    }
}
`);
                    done();
                });
        });
    });

    function aProject(appStateName: string, appFilePath: string, writeFileCallback: (filename: string, b: Buffer) => void, relativePath: string = null): gb.IGenerationProject {
        return {
            dir: __dirname,
            appStateName: appStateName,
            appSourcesDirectory: path.join(__dirname, 'resources'),
            appStateFileName: path.basename(appFilePath),
            tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
            writeFileCallback: writeFileCallback,
            relativePath: relativePath
        }
    }
});