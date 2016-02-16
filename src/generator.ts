import * as ts from "typescript";
import * as tsa from './tsAnalyzer';
import * as tsch from './tsCompilerHost';
import * as log from './logger';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export interface IGenerationProject {
    dir: string
    appStateName: string
    appSourcesDirectory: string
    appStateFileName: string
    tsOptions: ts.CompilerOptions
    relativePath?: string
    writeFileCallback: (filename: string, b: Buffer) => void
}

export interface IGenerationProcess {
    run(): Promise<any>;
}

export const mainStateIndex = 0;
export const stateNotFoundError = 'Main state file could not be found.';
export const stateImportKey = 's';

export function resolveBobfluxPrefix(mainState: tsa.IStateData): string {
    let founds = mainState.heritages.filter(h => h.indexOf('.IState') !== -1)
    return (founds.length === 0) ? 'bf' : founds[0].split('.')[0];
}

export function resolveState(allStates: tsa.IStateData[], stateName: string): tsa.IStateData {
    const states = allStates.filter(s => { return s.typeName === stateName });
    return states.length === 0 ? null : states[0];
}

export function resolveSourceFile(sourceFiles: ts.SourceFile[], fullPath: string): ts.SourceFile {
    let lowFullPath = fullPath.toLowerCase().replace(/\\/g, '/');
    let files = sourceFiles.filter(s => path.relative(s.path.toLowerCase(), lowFullPath) === '');
    if (files.length === 0)
        return null;
    return files[0];
}


export interface ILoadedParams {
    stateFilePath: string
    data: tsa.IStateSourceData
    sourceFiles: ts.SourceFile[]
    typeChecker: ts.TypeChecker
}

export function loadSourceFiles(project: IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger, rootStateKey: string): Promise<ILoadedParams> {
    return new Promise<ILoadedParams>((f, r) => {
        logger.info('Generator runs in: ' + project.appSourcesDirectory);
        logger.info('Application state file is: ' + project.appStateFileName);
        logger.info('Application state name is: ' + project.appStateName);
        let program = ts.createProgram([project.appStateFileName], project.tsOptions, tsch.createCompilerHost(project.appSourcesDirectory, logger));
        let tc = program.getTypeChecker();
        let sourceFiles = program.getSourceFiles();
        logger.info('Found source files: ', sourceFiles.map(s => s.path));

        let foundSource = resolveSourceFile(sourceFiles, path.join(project.appSourcesDirectory, project.appStateFileName));
        if (!foundSource) {
            logger.error('Source files could not be loaded.');
            r(stateNotFoundError);
            return;
        }
        let data = tsAnalyzer.getSourceData(foundSource, tc, tsa.resolvePathStringLiteral);
        const writeCallback = (f, c) => { project.writeFileCallback(f, new Buffer(c, 'utf-8')); }
        let filePath = path.join(path.dirname(foundSource.path), foundSource.fileName);
        f({
            stateFilePath: filePath,
            data: data,
            sourceFiles: sourceFiles,
            typeChecker: tc
        });
    });
}