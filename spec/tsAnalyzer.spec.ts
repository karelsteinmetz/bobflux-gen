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
    })

    function aProgram(currentDirectory: string, fileName: string): ts.Program {
        return ts.createProgram([fileName], tsOptions, tsch.createCompilerHost(currentDirectory, logger));
    }
})