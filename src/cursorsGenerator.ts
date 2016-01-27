import * as g from './generator';
import * as tsa from './tsAnalyzer';
import * as tsch from './tsCompilerHost';
import * as log from './logger';
import * as nameUnifier from './nameUnifier';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

var defaultLibFilename = path.join(path.dirname(require.resolve("typescript").replace(/\\/g, '/')), "lib.es6.d.ts");

const mainStateIndex = 0;
const stateNotFoundError = 'Main state file could not be found.';
export default (project: g.IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger): g.IGenerationProcess => {
    return {
        run: () => new Promise((f, r) => {
            logger.info('Cursors generator runs in: ' + project.appSourcesDirectory);
            logger.info('Application state file is: ' + project.appStateFileName);
            logger.info('Application state name is: ' + project.appStateName);
            let program = ts.createProgram([project.appStateFileName], project.tsOptions, tsch.createCompilerHost(project.appSourcesDirectory));
            let tc = program.getTypeChecker();
            const resolvePathStringLiteral = ((nn: ts.StringLiteral) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));
            let sourceFiles = program.getSourceFiles();
            logger.info('Found source files: ', sourceFiles.map(s => s.path));

            let foundSource = findSourceFile(sourceFiles, path.join(project.appSourcesDirectory, project.appStateFileName));
            if (!foundSource) {
                logger.error(stateNotFoundError);
                r(stateNotFoundError);
                return;
            }
            let data = tsAnalyzer.getSourceData(foundSource, tc, resolvePathStringLiteral);
            let writeCallback = (f, c) => { project.writeFileCallback(f, new Buffer(c, 'utf-8')); }
            let filePath = path.join(path.dirname(foundSource.path), foundSource.fileName);
            logger.info('Generating has been started for: ', filePath);
            let childStates = writeCursors(filePath, data, project.appStateName, writeCallback);
            logger.info('Generation ended');
            childStates.forEach(es => {
                let newESPath = path.join(path.dirname(es.parentFullPath), es.import.relativePath + '.ts');
                logger.info('Generating has been started for: ', newESPath);
                let esSourceFile = findSourceFile(sourceFiles, newESPath);
                writeCursors(newESPath, tsAnalyzer.getSourceData(esSourceFile, tc, resolvePathStringLiteral), es.state, writeCallback, es.prefix)
            });
            f();
        })
    }
}

function findSourceFile(sourceFiles: ts.SourceFile[], fullPath: string): ts.SourceFile {
    let sanitizedFullPath = fullPath.toLowerCase().replace(/\\/g, '/');
    let files = sourceFiles.filter(s => path.relative(s.path.toLowerCase(), sanitizedFullPath) === '');
    if (files.length === 0)
        return undefined;
    return files[0];
}

type PrefixMap = { [stateName: string]: string };

function writeCursors(stateFilePath: string, data: tsa.IStateSourceData, currentStateName: string, writeCallback: (filePath: string, content: string) => void, parentStatePrefix: string = null): IExternalChildState[] {
    let foundStates = data.states.filter(s => { return s.typeName === currentStateName });
    if (foundStates.length === 0)
        return [];
    let mainState = foundStates[0];
    let foundStateHeritages = mainState.heritages.filter(h => h.indexOf('.IState') !== -1)
    let bobfluxPrefix = (foundStateHeritages.length === 0) ? 'bf' : foundStateHeritages[0].split('.')[0];
    let nestedStates = data.states.filter(s => s.typeName !== currentStateName);
    let prefixMap: PrefixMap = {};
    const stateImportKey = 's';
    let externalChildStates: IExternalChildState[] = [];
    let content = `import * as ${stateImportKey} from './${data.fileName}';
${createImports(data.imports)}

`;
    if (!parentStatePrefix)
        content += `export let rootCursor: ${bobfluxPrefix}.ICursor<s.${mainState.typeName}> = ${bobfluxPrefix}.rootCursor

`;
    if (parentStatePrefix)
        content += `export let rootCursor: ${bobfluxPrefix}.ICursor<s.${mainState.typeName}> = {
    key: '${parentStatePrefix}'
}

`;
    function createCursorsForStateParams(state: tsa.IStateData, bobfluxPrefix: string, prefix: string = null): string {
        let nexts: INextIteration[] = [];
        let content = state.fields.map(f => {
            let key = createCursorKey(parentStatePrefix, prefix, f.name);
            let fType = f.isArray ? `${f.type}[]` : f.type;
            if (isExternalState(fType)) {
                let splitedImport = fType.split('.');
                externalChildStates.push({ state: splitedImport[1], import: data.imports.filter(i => i.prefix === splitedImport[0])[0], prefix: key, parentFullPath: stateFilePath });
            }
            let states = data.states.filter(s => s.typeName === f.type);
            if (states.length > 0)
                fType = `${stateImportKey}.${fType}`;
            let ct = `export let ${prefix === null ? f.name : nameUnifier.getStatePrefixFromKeyPrefix(prefix, f.name)}Cursor: ${bobfluxPrefix}.ICursor<${fType}> = {
    key: '${key}'
}
`;
            if (f.isArray)
                return ct;
            if (states.length > 0)
                nexts.push({ state: states[0], prefix: key });
            if (states.length > 1)
                throw 'Two states with same name could not be parsed. Compilator prevents this error.'
            return ct;
        }).join('\n');
        return content + (nexts.length > 0 ? '\n' : '') + nexts.map(n => createCursorsForStateParams(n.state, bobfluxPrefix, n.prefix)).join('\n');
    }
    content += createCursorsForStateParams(mainState, bobfluxPrefix);
    writeCallback(createCursorsFilePath(stateFilePath), content);
    return externalChildStates;
}

export function createCursorKey(...parts: string[]): string {
    return parts.filter(p => p !== null).join('.');
}

export function createCursorsFilePath(stateFilePath: string): string {
    return `${path.join(path.dirname(stateFilePath), path.basename(stateFilePath).replace(path.extname(stateFilePath), ''))}.cursors.ts`;
}

interface INextIteration {
    state: tsa.IStateData
    prefix: string
}

interface IExternalChildState {
    state: string
    import: tsa.IImportData
    prefix: string
    parentFullPath: string
}

function isExternalState(type: string): boolean {
    return type.split('.').length > 1;
}

function createImports(imports: tsa.IImportData[]): string {
    return imports.map(i => `import * as ${i.prefix} from '${i.relativePath}';`).join(`
`);
}