import * as g from './generator';
import * as tsa from './tsAnalyzer';
import * as tsch from './tsCompilerHost';
import * as log from './logger';
import * as nameUnifier from './nameUnifier';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

var defaultLibFilename = path.join(path.dirname(require.resolve("typescript").replace(/\\/g, "/")), "lib.es6.d.ts");

const mainStateIndex = 0;
export default (project: g.IGenerationProject, tsAnalyzer: tsa.ITsAnalyzer, logger: log.ILogger, applyRecurse: boolean = false, rootStateKey: string = null): g.IGenerationProcess => {
    return {
        run: () => new Promise((f, r) => {
            logger.info('Generator runs in: ' + project.appSourcesDirectory);
            logger.info('Application state file is: ' + project.appStateFileName);
            logger.info('Application state name is: ' + project.appStateName);
            let program = ts.createProgram([project.appStateFileName], project.tsOptions, tsch.createCompilerHost(project.appSourcesDirectory));
            let tc = program.getTypeChecker();
            const resolvePathStringLiteral = ((nn: ts.StringLiteral) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));
            let sourceFiles = program.getSourceFiles();
            logger.info('Found source files: ', sourceFiles.map(s => s.path));

            let foundSource = g.resolveSourceFile(sourceFiles, path.join(project.appSourcesDirectory, project.appStateFileName));
            if (!foundSource) {
                logger.error(g.stateNotFoundError);
                r(g.stateNotFoundError);
                return;
            }
            let data = tsAnalyzer.getSourceData(foundSource, tc, resolvePathStringLiteral);
            const writeCallback = (f, c) => { project.writeFileCallback(f, new Buffer(c, 'utf-8')); }
            let filePath = path.join(path.dirname(foundSource.path), foundSource.fileName);
            
            let relativePath = '';
            if (project.relativePath) {
                relativePath = path.join(path.dirname(filePath), project.relativePath);
                relativePath = path.relative(relativePath, path.dirname(filePath));
                logger.info('Relative path: ', relativePath);
            }
            try {
                writeBuilders(filePath, data, project.appStateName, relativePath, writeCallback, rootStateKey);
            } catch (e) {
                logger.error('Error on cursors writing.', e);
            }

            function writeBuilders(stateFilePath: string, data: tsa.IStateSourceData, mainStateName: string, relativePath: string, writeCallback: (filePath: string, content: string) => void, parentStateKey: string = null) {
                const stateImportKey = 's';
                let content = `import * as ${stateImportKey} from '${relativePath == '' ? './' + data.fileName : path.join(relativePath, data.fileName)}';
${createImports(data.imports, relativePath)}

`
                    + data.states.map(state => {
                        let nexts: INextIteration[] = [];
                        let name = `${nameUnifier.removeIfacePrefix(state.typeName)}Builder`;
                        let stateName = `${stateImportKey}.${state.typeName}`;
                        let content = `export class ${name} {
    private state: ${stateName} = ${stateImportKey}.default();

`
                        content += state.fields.map(f => {
                            let fType = f.isArray ? `${f.type}[]` : f.type;
                            let states = data.states.filter(s => s.typeName === f.type);
                            if (states.length > 0)
                                fType = `${stateImportKey}.${fType}`;
                            let ct = `    public ${nameUnifier.getStatePrefixFromKeyPrefix('with', f.name)}(${f.name}: ${fType}): ${name} {
        this.state.${f.name} = ${f.name};
        return this;
    };
`
                            return ct;
                        }).join('\n');
                        content += `
    public build(): ${stateName} {
`;
                        if (mainStateName === state.typeName)
                            content +=
                                `        s.bootstrap(this.state);
`
                        content +=
                            `        return this.state;
    }
}
`
                        return content;
                    }).join('\n')
                    
                logger.info('Generating has been started for: ', filePath);
                writeCallback(createBuildersFilePath(stateFilePath), content);
                logger.info('Generation ended');
            }
            f();
        })
    }
}

type PrefixMap = { [stateName: string]: string };
interface INextIteration {
    state: tsa.IStateData
    prefix: string
}

function createBuildersFilePath(stateFilePath: string): string {
    return `${path.join(path.dirname(stateFilePath), path.basename(stateFilePath).replace(path.extname(stateFilePath), ''))}.builders.ts`;
}

function createImports(imports: tsa.IImportData[], relativePath: string): string {
    return imports.map(i => `import ${i.prefix} from '${path.join(relativePath, i.relativePath)}'; `).join('\n');
}