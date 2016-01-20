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
            for (let i = 0; i < sourceFiles.length; i++) {
                let sourceFile = sourceFiles[i];
                let data = tsAnalyzer.getSourceData(sourceFile, tc, resolvePathStringLiteral);
                let fileContent = createText(data, project.appStateName);
                if (fileContent) {
                    let cursorsFile = `${path.join(path.dirname(sourceFile.path), path.basename(sourceFile.fileName).replace(path.extname(sourceFile.fileName), ''))}.cursors.ts`;
                    project.writeFileCallback(cursorsFile, new Buffer(fileContent, 'utf-8'))
                }
            }
            f();
        })
    }
}

type PrefixMap = { [stateName: string]: string };

function createText(data: tsa.IStateSourceData, mainStateName: string): string {
    let mainStates = data.states.filter(s => s.typeName === mainStateName);
    if (mainStates.length === 0)
        return null;
    let mainState = mainStates[0];
    let foundStateHeritages = mainState.heritages.filter(h => h.indexOf('.IState') !== -1)
    let bobfluxPrefix = (foundStateHeritages.length === 0) ? 'bf' : foundStateHeritages[0].split('.')[0];
    let nestedStates = data.states.filter(s => s.typeName !== mainStateName);
    let prefixMap: PrefixMap = {};
    let stateImportKey = 's';
    let content = `import * as ${stateImportKey} from './${data.fileName}';
${createImports(data.imports)}

export let appCursor: ${bobfluxPrefix}.ICursor<s.${mainState.typeName}> = ${bobfluxPrefix}.rootCursor

`;
    function createCursorsForStateParams(state: tsa.IStateData, bobfluxPrefix: string, prefix: string = null): string {
        let nexts: INextIteration[] = [];
        let content = state.fields.map(f => {
            let key = `${prefix === null ? f.name : `${prefix}.${f.name}`}`;
            let fType = f.isArray ? `${f.type}[]` : f.type;
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
    content += createCursorsForStateParams(mainState, bobfluxPrefix)
    return content;
}

interface INextIteration {
    state: tsa.IStateData
    prefix: string
}

function isExternalState(type: string): boolean {
    return type.split('.').length > 1;
}

function createImports(imports: tsa.IImportData[]): string {
    return imports.map(i => `import ${i.prefix} from '${i.filePath}';`).join(`
`);
}