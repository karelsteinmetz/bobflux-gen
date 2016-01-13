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

    describe('file stateWithArray', () => {
        beforeEach(() => {
            testCase = {
                do: () => new Promise<string>((f, r) => {
                    g.default(aProject('IApplicationState', './stateWithArray.ts', (filename: string, b: Buffer) => {
                        if (filename.indexOf('stateWithArray') !== -1)
                            f(b.toString('utf8'));
                    }), tsa.create(logger), logger).run();
                })
            };
        });

        it('generates cursors for appState array fields', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`import * as s from './stateWithArray';
import * as bf from 'bobflux';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringsCursor: bf.ICursor<string[]> = {
    key: 'strings'
}

export let numbersCursor: bf.ICursor<INumber[]> = {
    key: 'numbers'
}
`);
                    done();
                });
        });
    });

    describe('stateWithExternalState', () => {
        describe('file stateWithBaseTypes', () => {
            beforeEach(() => {
                testCase = {
                    do: () => new Promise<string>((f, r) => {
                        g.default(aProject('IApplicationState', './stateWithExternalState.ts', (filename: string, b: Buffer) => {
                            if (filename.indexOf('stateWithNestedState') !== -1)
                                f(b.toString('utf8'));
                        }), tsa.create(logger), logger).run();
                    })
                };
            });

            it('generates cursors for appState fields', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toBe(`import * as s from './stateWithNestedState';
import * as bf from 'bobflux';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}

export let nestedCursor: bf.ICursor<s.INestedState> = {
    key: 'nested'
}

export let secondNestedCursor: bf.ICursor<s.ISecondNestedState> = {
    key: 'secondNested'
}

export let nestedNumberValueCursor: bf.ICursor<number> = {
    key: 'numberValue'
}

export let secondNestedStringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}
`);
                        done();
                    });
            });
        });

        describe('file stateWithExternalState', () => {
            beforeEach(() => {
                testCase = {
                    do: () => new Promise<string>((f, r) => {
                        g.default(aProject('IApplicationState', 'stateWithExternalState', (filename: string, b: Buffer) => {
                            if (filename.indexOf('stateWithExternalState') !== -1)
                                f(b.toString('utf8'));
                        }), tsa.create(logger), logger).run();
                    })
                };
            });

            it('imports related state', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text.split('\n')[0]).toBe(`import * as s from './stateWithExternalState';`);
                        done();
                    });
            });

            it('imports bobflux as node module', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text.split('\n')[1]).toBe(`import * as bf from 'bobflux';`);
                        done();
                    });
            });

            it('imports external state', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text.split('\n')[2]).toBe(`import * as ns from './stateWithNestedState';`);
                        done();
                    });
            });

            it('generates cursors for appState fields', (done) => {
                testCase
                    .do()
                    .then(text => {
                        expect(text).toBe(`import * as s from './stateWithExternalState';
import * as bf from 'bobflux';
import * as ns from './stateWithNestedState';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}

export let baseTypesCursor: bf.ICursor<ns.INestedState> = {
    key: 'baseTypes'
}
`);
                        done();
                    });
            });
        });
    });

    describe('stateWithNestedState', () => {
        beforeEach(() => {
            testCase = {
                do: () => new Promise<string>((f, r) => {
                    g.default(aProject('IApplicationState', './stateWithNestedState.ts', (filename: string, b: Buffer) => {
                        f(b.toString('utf8'));
                    }), tsa.create(logger), logger).run();
                })
            };
        });

        it('imports bobflux as node module', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[1]).toBe(`import * as bf from 'bobflux';`);
                    done();
                });
        });

        it('imports related state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[0]).toBe(`import * as s from './stateWithNestedState';`);
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

        it('generates cursor for string fields in app state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}
`);
                    done();
                });
        });

        it('generates cursor for nested state in app state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}
`);
                    done();
                });
        });

        it('generates cursor for secondNested field with parent cursor prefix', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toContain(`
export let secondNestedStringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}
`);
                    done();
                });
        });

        it('generates cursors for appState fields', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text).toBe(`import * as s from './stateWithNestedState';
import * as bf from 'bobflux';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}

export let nestedCursor: bf.ICursor<s.INestedState> = {
    key: 'nested'
}

export let secondNestedCursor: bf.ICursor<s.ISecondNestedState> = {
    key: 'secondNested'
}

export let nestedNumberValueCursor: bf.ICursor<number> = {
    key: 'numberValue'
}

export let secondNestedStringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}
`);
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
                    g.default(aProject('IApplicationState', './stateWithBaseTypes.ts', (filename: string, b: Buffer) => {
                        if (filename.indexOf('stateWithBaseTypes') !== -1)
                            f(b.toString('utf8'));
                    }), tsa.create(logger), logger).run();
                })
            };
        });

        it('imports bobflux as node module', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[1]).toBe(`import * as bf from 'bobflux';`);
                    done();
                });
        });

        it('imports related state', (done) => {
            testCase
                .do()
                .then(text => {
                    expect(text.split('\n')[0]).toBe(`import * as s from './stateWithBaseTypes';`);
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
                    expect(text).toBe(`import * as s from './stateWithBaseTypes';
import * as bf from 'bobflux';

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

    // logger = {
    //     info: (message: string, params?: any) => { },
    //     warning: (message: string, params?: any) => { },
    //     error: (message: string, params?: any) => { },
    //     debug: (message: string, params?: any) => { (message.indexOf('Visited kind') === 0 || message.indexOf('Source result') === 0) && console.log(`Debug: ${message}`, params); }
    // }

});