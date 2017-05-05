import * as ts from "typescript";
import * as path from 'path';
import * as tsa from '../src/tsAnalyzer';
import * as tsch from '../src/tsCompilerHost';
import * as log from '../src/logger';

describe('tsAnalyzer', () => {
    let analyzer: tsa.ITsAnalyzer;
    let logger: log.ILogger = log.create(false, false, false, false);
    let tsOptions: ts.CompilerOptions = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true };

    beforeEach(() => {
        analyzer = tsa.create(logger);
    });

    describe('interfaces', () => {
        describe('internal enum', () => {
            let program: ts.Program

            beforeEach(() => {
                program = aProgram('./spec/resources/', 'stateWithEnum.ts');
            });

            it('has parsed data', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(data.enums.length).toBe(1);
            });

            it('gets name', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(data.enums.length).toBe(1);
                expect(data.enums[0].name).toBe('SomeEnum');
            });
        })

        describe('internal custom type', () => {
            let program: ts.Program

            beforeEach(() => {
                program = aProgram('./spec/resources/', 'stateWithType.ts');
            });

            it('has parsed data', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(data.customTypes.length).toBe(1);
            });

            it('gets name', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(data.customTypes.length).toBe(1);
                expect(data.customTypes[0].name).toBe('MyMap');
            });
        });

        describe('generic state', () => {
            let program: ts.Program

            beforeEach(() => {
                program = aProgram('./spec/resources/', 'stateWithGeneric.ts');
            });

            it('has parsed data', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(data.states.length).toBe(2);
            });

            it('has generic declarations', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(getState(data, 'IGenericState').typeArguments).toEqual(['T']);
            });

            it('field has declared generic type', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                let state = getState(data, 'IApplicationState');

                expect(state.fields[0].type.arguments).toEqual([{ name: 'string' }]);
            });
        });
    });

    describe('classes', () => {
        let program: ts.Program;
        let sourceFile: ts.SourceFile;

        beforeEach(() => {
            program = aProgram('./spec/resources/', 'point.ts');
            sourceFile = program.getSourceFile(program.getRootFileNames()[0]);
        });

        describe('generic state', () => {
            it('has parsed data', () => {
                let data = analyzer.getSourceData(sourceFile, program.getTypeChecker());

                expect(data.states.length).toBe(2);
            });

            it('gets nested type of field', () => {
                let data = analyzer.getSourceData(sourceFile, program.getTypeChecker());

                let point = getState(data, 'PointBaseDto');
                expect(point.fields.map(f => f.name)).toEqual(['position']);
                expect(point.fields.map(f => f.type.name)).toEqual(['p.PositionDto']);
            });

            it('gets name of fields in point', () => {
                let data = analyzer.getSourceData(sourceFile, program.getTypeChecker());

                let point = getState(data, 'PointDto');
                expect(point.fields.map(f => f.name)).toEqual(['id']);
            });

            it('gets heritages', () => {
                let data = analyzer.getSourceData(sourceFile, program.getTypeChecker());

                let point = getState(data, 'PointDto');
                expect(point.heritages).toEqual(['PointBaseDto']);
            });
        });

        describe('generic state', () => {
            let program: ts.Program

            beforeEach(() => {
                program = aProgram('./spec/resources/', 'classWithGenericType.ts');
            });

            it('has parsed data', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(data.states.length).toBe(2);
            });

            it('has generic declarations', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                expect(getState(data, 'GenericState').typeArguments).toEqual(['T']);
            });

            it('field has declared generic type', () => {
                let data = analyzer.getSourceData(program.getSourceFiles()[0], program.getTypeChecker());

                let state = getState(data, 'ApplicationState');

                expect(state.fields[0].type.arguments).toEqual([{ name: 'string' }]);
            });
        });
    })

    function getState(data: tsa.IStateSourceData, name: string): tsa.IStateData {
        let found = data.states.filter(s => s.typeName === name);
        if (found.length === 0)
            throw `No state ${name} could not be found. Available states: ${data.states.map(s => s.typeName)}`;
        return data.states.filter(s => s.typeName === name)[0];
    }

    function aProgram(currentDirectory: string, fileName: string): ts.Program {
        return ts.createProgram([fileName], tsOptions, tsch.createCompilerHost(currentDirectory, logger));
    }
})