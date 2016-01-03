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
            logger.info('Cursors generator runs in: ' + path.dirname(project.appSourcesDirectory));
            logger.info('Application state file is: ' + path.basename(project.appSourcesDirectory));
            logger.info('Application state name is: ' + project.appStateName);
            let program = ts.createProgram([path.basename(project.appSourcesDirectory)], project.tsOptions, tsch.createCompilerHost(path.dirname(project.appSourcesDirectory)));
            let tc = program.getTypeChecker();
            const resolvePathStringLiteral = ((nn: ts.StringLiteral) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));
            let sourceFiles = program.getSourceFiles();
            logger.debug('Found source files: ', sourceFiles);
            for (let i = 0; i < sourceFiles.length; i++) {
                let sourceFile = sourceFiles[i];
                let data = tsAnalyzer.getSourceData(sourceFile, tc, resolvePathStringLiteral);
                let fileContent = createText(data);
                project.writeFileCallback(`${path.join(path.dirname(sourceFile.path), path.basename(sourceFile.fileName).replace(path.extname(sourceFile.fileName), ''))}.cursors.ts`, new Buffer(fileContent, 'utf-8'))
                f();
            }
        })
    }
}

function createText(data: tsa.IStateSourceData): string {
    return `import * as s from './${data.fileName}';
${createImports(data.imports)}

export let appCursor: bf.ICursor<s.${data.states[mainStateIndex].name}> = bf.rootCursor
` +
        data.states
            .map((s, i) =>
                s.fields
                    .map(f => {
                        return `
export let ${i === mainStateIndex ? f.name : getStatePrefix(s.name, f.name)}Cursor: bf.ICursor<${f.isState ? 's.' + f.type : f.type}> = {
    key: '${f.name}'
}`
                    })
                    .join('\n'))
            .join('\n') + '\n';
}

function createImport(imp: tsa.IImportData): string {
    return `import ${imp.prefix} from aaa;`;
}

function createImports(imports: tsa.IImportData[]): string {
    return imports.map(i => `import ${i.prefix} from '${i.filePath}';`).join(`
`);
}

function getStatePrefix(stateName: string, propName: string): string {
    let s = stateName.replace('State', '');
    s = s.indexOf('I', 0) === 0 && s.slice(1);
    s = s.charAt(0).toLowerCase() + s.slice(1);
    s += propName.charAt(0).toUpperCase() + propName.slice(1)
    return s;
}