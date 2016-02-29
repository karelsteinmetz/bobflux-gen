import * as g from './generator';
import * as tsa from './tsAnalyzer';
import * as tsch from './tsCompilerHost';
import * as log from './logger';
import * as nameUnifier from './nameUnifier';
import * as pu from './pathUtils';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

var defaultLibFilename = path.join(path.dirname(require.resolve("typescript").replace(/\\/g, "/")), "lib.es6.d.ts");

const stateImportKey = 's';

export default (project: g.IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger, applyRecurse: boolean = false, rootStateKey: string = null): g.IGenerationProcess => {
    return {
        run: () => runBase(false, project, tsAnalyzer, logger, rootStateKey),
        runRecurse: () => runBase(true, project, tsAnalyzer, logger, rootStateKey)
    }
}

function runBase(applyRecurse: boolean, project: g.IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger, rootStateKey: string): Promise<any> {
    return new Promise((f, r) => {
        const writeCallback = (fn, c) =>  project.writeFileCallback(fn, new Buffer(c, 'utf-8'));
        g.loadSourceFiles(project, tsAnalyzer, logger)
            .then(p => {
                try {
                    let filePath = path.join(path.dirname(p.stateFilePath), path.basename(p.stateFilePath));
                    try {
                        writeBuilders(filePath, p.data, project.appStateName, project.relativePath, writeCallback, rootStateKey);
                    } catch (e) {
                        logger.error('Error on cursors writing.', e);
                    }
                } catch (e) {
                    logger.error('Error on cursors writing.', e);
                }

                function writeBuilders(stateFilePath: string, data: tsa.IStateSourceData, currentStateName: string, relativePath: string, writeCallback: (filePath: string, content: string) => void, parentStateKey: string = null) {
                    let mainState = g.resolveState(data.states, currentStateName);
                    if (!mainState)
                        return [];
                    let buildersFilePath = createBuildersFilePath(stateFilePath, relativePath);
                    let rootRelativePath = pu.resolveRelatioveStateFilePath(path.dirname(buildersFilePath), path.dirname(stateFilePath));
                    function createForStateParams(state: tsa.IStateData, prefix: string = null): string {
                        let nexts: INextIteration[] = [];
                        let inner = data.states.map(state => {
                            let nexts: INextIteration[] = [];
                            let name = `${nameUnifier.removeIfacePrefix(state.typeName)}Builder`;
                            let stateName = `${stateImportKey}.${state.typeName}`;
                            let content = `export class ${name} {
    private state: ${stateName} = ${stateImportKey}.default();

`
                            content += state.fields.map(f => {
                                let key = g.createCursorKey(parentStateKey, prefix, f.name);
                                let fieldType = f.isArray ? `${f.type}[]` : f.type;
                                if (applyRecurse && g.isExternalState(fieldType)) {
                                    let typeParts = fieldType.split('.');
                                    let innerFilePath = path.join(path.dirname(stateFilePath), data.imports.filter(i => i.prefix === typeParts[0])[0].relativePath + '.ts');
                                    let innerSourceFile = g.resolveSourceFile(p.sourceFiles, innerFilePath);
                                    if (innerSourceFile) {
                                        let innerRelativePath = pu.resolveRelatioveStateFilePath(path.dirname(innerSourceFile.path), path.dirname(buildersFilePath));
                                        writeBuilders(innerFilePath, tsAnalyzer.getSourceData(innerSourceFile, p.typeChecker, tsa.resolvePathStringLiteral), typeParts[1], innerRelativePath, writeCallback, key);
                                    }
                                }
                                let fType = f.isArray ? `${f.type}[]` : f.type;
                                let states = data.states.filter(s => s.typeName === f.type);
                                if (states.length > 0)
                                    fType = `${stateImportKey}.${fType}`;
                                let ct = `    public ${nameUnifier.getStatePrefixFromKeyPrefix('with', f.name)}(${f.name}: ${fType}): ${name} {
        this.state.${f.name} = ${f.name};
        return this;
    };
`
                                if (states.length > 0)
                                    nexts.push({ state: states[0], prefix: key });
                                if (states.length > 1)
                                    throw 'Two states with same name could not be parsed. It\'s compilation error.';
                                return ct;
                            }).join('\n');
                            content += `
    public build(): ${stateName} {
`;
                            if (currentStateName === state.typeName)
                                content +=
                                    `        s.bootstrap(this.state);
`
                            content +=
                                `        return this.state;
    }
}
`
                            return content;
                        }).join('\n');
                        return inner + (nexts.length > 0 ? '\n' : '') + nexts.map(n => createForStateParams(n.state, n.prefix)).join('\n');
                    }

                    let fieldsContent = createForStateParams(mainState);
                    logger.info('Generating has been started for: ', stateFilePath);
                    writeCallback(
                        buildersFilePath,
                        g.createFullImports(!relativePath ? './' + data.fileName : path.join(rootRelativePath.replace(/\\/g, "/"), data.fileName), data.imports)
                        + fieldsContent
                    );
                    logger.info('Generation ended');
                }
                f();
            })
            .catch(e => r(e));
    })
}

type PrefixMap = { [stateName: string]: string };
interface INextIteration {
    state: tsa.IStateData
    prefix: string
}

function createBuildersFilePath(stateFilePath: string, relativePath: string): string {
    return relativePath
        ? `${path.join(path.join(path.dirname(stateFilePath), relativePath), path.basename(stateFilePath).replace(path.extname(stateFilePath), ''))}.builders.ts`
        : `${path.join(path.dirname(stateFilePath)), path.basename(stateFilePath).replace(path.extname(stateFilePath), '')}.builders.ts`;
}

function resolveRelativePath(filePath: string, projectRelativePath: string, parentRelativePath: string = './'): string {
    let relativePath = path.join(path.dirname(filePath), projectRelativePath);
    return path.relative(relativePath, path.dirname(filePath));
}
