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

export default (project: g.IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger, applyRecurse: boolean = false, rootStateKey: string = null): g.IGenerationProcess => {
    return {
        run: () => new Promise((f, r) => {
            const writeCallback = (fn, c) => { project.writeFileCallback(fn, new Buffer(c, 'utf-8')); }
            g.loadSourceFiles(project, tsAnalyzer, logger, rootStateKey)
                .then(p => {
                    try {
                        writeCursors(p.stateFilePath, p.data, project.appStateName, writeCallback, rootStateKey);
                    } catch (e) {
                        logger.error('Error on cursors writing.', e);
                    }
                    function writeCursors(stateFilePath: string, data: tsa.IStateSourceData, currentStateName: string, writeCallback: (filePath: string, content: string) => void, parentStateKey: string = null) {
                        let mainState = g.resolveState(data.states, currentStateName);
                        if (!mainState)
                            return [];
                        const bobfluxPrefix = g.resolveBobfluxPrefix(mainState);
                        function createCursorsForStateParams(state: tsa.IStateData, bobfluxPrefix: string, prefix: string = null): string {
                            let nexts: INextIteration[] = [];
                            let inner = state.fields.map(f => {
                                let key = g.createCursorKey(parentStateKey, prefix, f.name);
                                let fieldType = f.isArray ? `${f.type}[]` : f.type;
                                if (applyRecurse && g.isExternalState(fieldType)) {
                                    let typeParts = fieldType.split('.');
                                    let innerFilePath = path.join(path.dirname(stateFilePath), data.imports.filter(i => i.prefix === typeParts[0])[0].relativePath + '.ts');
                                    let innerSourceFile = g.resolveSourceFile(p.sourceFiles, innerFilePath);
                                    if (innerSourceFile)
                                        writeCursors(innerFilePath, tsAnalyzer.getSourceData(innerSourceFile, p.typeChecker, tsa.resolvePathStringLiteral), typeParts[1], writeCallback, key);
                                }
                                let states = data.states.filter(s => s.typeName === f.type);
                                if (states.length > 0)
                                    fieldType = `${g.stateImportKey}.${fieldType}`;
                                if (f.isArray)
                                    return createFieldCursor(prefix, key, f.name, bobfluxPrefix, fieldType);
                                if (states.length > 0)
                                    nexts.push({ state: states[0], prefix: key });
                                if (states.length > 1)
                                    throw 'Two states with same name could not be parsed. It\'s compilation error.';
                                return createFieldCursor(prefix, key, f.name, bobfluxPrefix, fieldType);
                            }).join('\n');
                            return inner + (nexts.length > 0 ? '\n' : '') + nexts.map(n => createCursorsForStateParams(n.state, bobfluxPrefix, n.prefix)).join('\n');
                        }
                        let fieldsContent = createCursorsForStateParams(mainState, bobfluxPrefix);
                        logger.info('Generating has been started for: ', stateFilePath);
                        writeCallback(
                            createCursorsFilePath(stateFilePath),
                            g.createFullImports(`./${data.fileName}`, data.imports)
                            + createRootCursor(parentStateKey, bobfluxPrefix, mainState.typeName)
                            + fieldsContent
                        );
                        logger.info('Generation ended');
                    }
                    f();
                })
                .catch(e => r(e));
        })
    }
}


function createFieldCursor(prefix: string, key: string, fieldName: string, bobfluxPrefix: string, typeName: string): string {
    return `export const ${prefix === null ? fieldName : nameUnifier.getStatePrefixFromKeyPrefix(prefix, fieldName)}Cursor: ${bobfluxPrefix}.ICursor<${typeName}> = {
    key: '${key}'
}
`;
}

function createRootCursor(prefix: string, bobfluxPrefix: string, typeName: string): string {
    return prefix
        ? `export const rootCursor: ${bobfluxPrefix}.ICursor<s.${typeName}> = {
    key: '${prefix}'
}

`
        : `export const rootCursor: ${bobfluxPrefix}.ICursor<s.${typeName}> = ${bobfluxPrefix}.rootCursor

`;
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
