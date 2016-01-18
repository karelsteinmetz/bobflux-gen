import * as g from './generator';
import * as tsa from './tsAnalyzer';
import * as tsch from './tsCompilerHost';
import * as log from './logger';
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
                let cursorsFile = `${path.join(path.dirname(sourceFile.path), path.basename(sourceFile.fileName).replace(path.extname(sourceFile.fileName), ''))}.cursors.ts`;
                project.writeFileCallback(cursorsFile, new Buffer(fileContent, 'utf-8'))
            }
            f();
        })
    }
}

type PrefixMap = { [stateName: string]: string };

function createText(data: tsa.IStateSourceData, mainStateName: string): string {
    let mainStates = data.states.filter(s => s.name === mainStateName);
    if (mainStates.length === 0)
        return `Main state ${mainStateName} not found`;
    let mainState = mainStates[0];
    let foundStateHeritages = mainState.heritages.filter(h => h.indexOf('.IState') !== -1)
    let bobfluxPrefix = (foundStateHeritages.length === 0) ? 'bf': foundStateHeritages[0].split('.')[0];
    console.log('mainState', mainState.heritages);
    let nestedStates = data.states.filter(s => s.name !== mainStateName);
    let prefixMap: PrefixMap = {};
    return `import * as s from './${data.fileName}';
${createImports(data.imports)}

export let appCursor: ${bobfluxPrefix}.ICursor<s.${mainState.name}> = ${bobfluxPrefix}.rootCursor
`
        + mainState.fields
            .map(f => {
                let pType = f.type;
                prefixMap[f.type] = f.name;
                if (f.isState) {
                    pType = isExternalState(f.type) ? f.type : 's.' + f.type;
                }
                return `
export let ${f.name}Cursor: ${bobfluxPrefix}.ICursor<${f.isArray ? pType + '[]' : pType}> = {
    key: '${f.name}'
}`
            })
            .join('\n')
        + (nestedStates.length > 0 ? `
`: '')
        + nestedStates
            .filter(s => !prefixMap[s.type])
            .map((s, i) => {
                let result = writeNestedType(s, prefixMap[s.name], bobfluxPrefix);
                return result.content;
            })
            .join('\n') + '\n';
}

interface IResult {
    prefixMap: PrefixMap,
    content: string
}

function writeNestedType(data: tsa.IStateData, prefix: string, bobfluxPrefix: string): IResult {
    let prefixMap: PrefixMap = {};
    let content = data.fields
        .map(f => {
            let pType = f.type;
            prefixMap[f.type] = prefix + '.' + f.name
            if (f.isState) {
                pType = isExternalState(f.type) ? f.type : 's.' + f.type;
            }
            return `
export let ${getStatePrefix2(prefix, f.name)}Cursor: ${bobfluxPrefix}.ICursor<${f.isArray ? pType + '[]' : pType}> = {
    key: '${prefix}.${f.name}'
}`
        })
        .join('\n')
    return { prefixMap: prefixMap, content: content };
}

function isExternalState(type: string): boolean {
    return type.split('.').length > 1;
}

function createImports(imports: tsa.IImportData[]): string {
    return imports.map(i => `import ${i.prefix} from '${i.filePath}';`).join(`
`);
}

function getStatePrefix2(prefix: string, propName: string): string {
    let s = prefix;
    s += propName.charAt(0).toUpperCase() + propName.slice(1)
    return s;
}

function getStatePrefix(stateName: string, propName: string): string {
    let s = stateName.replace('State', '');
    s = s.indexOf('I', 0) === 0 && s.slice(1);
    s = s.charAt(0).toLowerCase() + s.slice(1);
    s += propName.charAt(0).toUpperCase() + propName.slice(1)
    return s;
}