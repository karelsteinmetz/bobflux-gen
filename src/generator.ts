import * as ts from "typescript";
import * as tsa from './tsAnalyzer';
import * as tsch from './tsCompilerHost';
import * as log from './logger';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export interface IGenerationProject {
    version: string,
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
    runRecurse(): Promise<any>;
}

export const mainStateIndex = 0;
export const stateNotFoundError = 'Main state file could not be found.';
export const stateImportKey = 's';

export function resolveBobfluxPrefix(mainState: tsa.IStateData): string {
    let founds = mainState.heritages.filter(h => h.indexOf('.IState') !== -1 || h.indexOf('.IRouteComponentState') !== -1 || h.indexOf('.IComponentState') !== -1)
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

export function loadSourceFiles(project: IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger): Promise<ILoadedParams> {
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
        let data = tsAnalyzer.getSourceData(foundSource, tc);
        let filePath = path.join(path.dirname(foundSource.path), foundSource.fileName);
        f({
            stateFilePath: filePath,
            data: data,
            sourceFiles: sourceFiles,
            typeChecker: tc
        });
    });
}

export function isExternalState(type: string, data: tsa.IStateSourceData): boolean {
    return type.split('.')[0] in data.sourceDeps;
}

export function getExternalAlias(type: string, data: tsa.IStateSourceData): tsa.IImportData & { sourceType: string } {
    const typePath = type.split('.');
    const dep = data.sourceDeps[typePath[0]];
    if (!dep)
        return null;
    return Object.assign(
        {},
        dep,
        {
            sourceType: typePath[0] === dep.prefix
                ? typePath[1]
                : dep.types.find(t => t.targetType === typePath[0]).sourceType
        }
    );
}

export function getFullType(t: tsa.ITypeData, data: tsa.IStateSourceData, stateAlias: string) {
    let fieldType = t.name;
    if (isExternalState(t.name, data)) {
        let alias = getExternalAlias(t.name, data);
        fieldType = `${alias.prefix}.${alias.sourceType}`;
    }
    if (isFieldEnumType(fieldType, data.enums)
        || isCustomType(fieldType, data.customTypes)
        || data.states.filter(s => s.typeName === t.name).length > 0)
        fieldType = `${stateAlias}.${fieldType}`;
    if (t.arguments)
        fieldType += `<${t.arguments.map(t => getFullType(t, data, stateAlias)).join(', ')}>`;
    if (t.isArray)
        fieldType += '[]';
    if (t.indexer)
        fieldType = `{ [${t.indexer}]: ${fieldType} }`;
    return fieldType;
}

export function composeCursorKey(...parts: string[]): string {
    return parts.filter(p => p !== null).join('.');
}

export function createFullImports(stateAlias: string, stateFilePath: string, imports: tsa.IImportData[]): string {
    return `import * as ${stateAlias} from '${stateFilePath}';
${createImports(imports)}

export * from '${stateFilePath}';

`;
}

export const createUnusedAlias = tsa.createUnusedAlias;

export function createImports(imports: tsa.IImportData[]): string {
    return imports.map(i => `import * as ${i.prefix} from '${i.relativePath}';`).join('\n');
}

export function isFieldEnumType(fieldType: string, enums: tsa.IEnumData[]): boolean {
    return enums.filter(e => e.name === fieldType).length > 0;
}

export function isCustomType(fieldType: string, customeTypes: tsa.ICustomTypeData[]): boolean {
    return customeTypes.filter(e => e.name === fieldType).length > 0;
}

export function isRouteComponentState(...heritages: string[]): boolean {
    return heritages.filter(h => h.indexOf('IRouteComponentState') !== -1).length > 0;
}

export function isComponentState(...heritages: string[]): boolean {
    return heritages.filter(h => h.indexOf('IComponentState') !== -1).length > 0;
}

export function createAutogeneratedHeader(version: string) {
    return `// 
// This source code was auto-generated by bobflux-gen, Version=${version}.
// Don't modify this file but re-generate it by bobflux-gen.
// Bobflux-gen - https://www.npmjs.com/package/bobflux-gen
//

`;
}