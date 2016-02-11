import * as ts from "typescript";
import * as tsa from './tsAnalyzer';
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