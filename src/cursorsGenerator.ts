import * as g from './generator';
import * as ts from 'typescript';
import * as fs from "fs";
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

var defaultLibFilename = path.join(path.dirname(require.resolve("typescript").replace(/\\/g, "/")), "lib.es6.d.ts");

const mainStateIndex = 0;
export default (project: g.IGenerationProject): g.IGenerationProcess => {
    return {
        run: () => new Promise((f, r) => {
            console.log('Cursors generator runs in: ' + path.dirname(project.appSourcesDirectory));
            console.log('Application state file is: ' + path.basename(project.appSourcesDirectory));
            console.log('Application state name is: ' + project.appStateName);
            let program = ts.createProgram([path.basename(project.appSourcesDirectory)], project.tsOptions, createCompilerHost(path.dirname(project.appSourcesDirectory)));
            let tc = program.getTypeChecker();
            const resolvePathStringLiteral = ((nn: ts.StringLiteral) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));
            let sourceFiles = program.getSourceFiles();
            // console.log('Found source files: ', sourceFiles);
            for (let i = 0; i < sourceFiles.length; i++) {
                let data = gatherSourceInfo(sourceFiles[i], tc, resolvePathStringLiteral);
                let cursorsText =
                    `import * as bf from 'bobflux';
import * as s from './${data.fileName}';

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
                project.writeFileCallback('cursors.ts', new Buffer(cursorsText, 'utf-8'))
                f();
            }
        })
    }
}

function getStatePrefix(stateName: string, propName: string): string {
    let s = stateName.replace('State', '');
    s = s.indexOf('I', 0) === 0 && s.slice(1);
    s = s.charAt(0).toLowerCase() + s.slice(1);
    s += propName.charAt(0).toUpperCase() + propName.slice(1)
    return s;
}

export interface IStateFieldData {
    name: string
    type: string
    isState: boolean
}

export interface IStateData {
    name: string
    type: ts.SyntaxKind
    fileName: string
    fields: IStateFieldData[]
}

export interface IStateSourceData {
    sourceFile: ts.SourceFile
    sourceDeps: [string, string][]
    filePath: string
    fileName: string
    states: IStateData[]
}

export function gatherSourceInfo(source: ts.SourceFile, tc: ts.TypeChecker, resolvePathStringLiteral: (sl: ts.StringLiteral) => string): IStateSourceData {
    var result: IStateSourceData = {
        sourceFile: source,
        sourceDeps: [],
        filePath: null,
        fileName: null,
        states: []
    };
    function visit(n: ts.Node) {
        // console.log('n.kind: ', n.kind);
        if (n.kind === ts.SyntaxKind.SourceFile) { // 249
            let sf = <ts.SourceFile>n;
            result.filePath = sf.path;
            result.fileName = sf.fileName;
        }
        if (n.kind === ts.SyntaxKind.ImportDeclaration) { //223
            let im = <ts.ImportDeclaration>n;
            // console.log('im: ', im);
        }
        if (n.kind === ts.SyntaxKind.ImportClause) { //224
            let ic = <ts.ImportClause>n;
            // console.log('ic: ', ic);
        }
        else if (n.kind === ts.SyntaxKind.InterfaceDeclaration) { //216
            let ce = <ts.InterfaceDeclaration>n;
            result.states.push({
                name: ce.name.text,
                type: ce.kind,
                fileName: (<ts.SourceFile>ce.parent).fileName,
                fields: []
            });
        }
        else if (n.kind === ts.SyntaxKind.TypeReference) { //151
            // let tr = <ts.TypeReference>n;
        }
        else if (n.kind === ts.SyntaxKind.PropertySignature) { //140
            let ps = <ts.PropertySignature>n;
            if (ps.parent.kind !== ts.SyntaxKind.InterfaceDeclaration)
                throw 'Properties in Interfaces are only allowed.'
            let iface = result.states.filter(s => s.name === (<ts.InterfaceDeclaration>ps.parent).name.text)[0];
            if (ps.type.kind === ts.SyntaxKind.TypeReference)
                iface.fields.push({ name: ps.name.getText(), type: (<ts.TypeReferenceNode>ps.type).typeName.getText(), isState: true })
            else
                iface.fields.push({ name: ps.name.getText(), type: ts.tokenToString(ps.type.kind), isState: false })
        }
        ts.forEachChild(n, visit);
    }
    visit(source);
    // console.log('result: ', result, result.states[0].fields);
    return result;
}

var lastLibPrecompiled;
function createCompilerHost(currentDirectory): ts.CompilerHost {
    function getCanonicalFileName(fileName) {
        return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
    }
    function getSourceFile(filename, languageVersion, onError) {
        if (filename === defaultLibFilename) {
            return null;
        }
        try {
            let filePath = filename === defaultLibFilename ? defaultLibFilename : path.join(currentDirectory, filename);
            console.log('getSourceFile - path: ', filePath);
            var text = fs.readFileSync(filePath).toString();
            // console.log('getSourceFile - text: ', text);
        } catch (e) {
            return null;
        }
        return ts.createSourceFile(filename, text, languageVersion, true);
    }
    function writeFile(fileName, data, writeByteOrderMark, onError) {
        try {
            var text = ts.sys.readFile(fileName, 'utf-8');
        } catch (e) {
            text = "";
        }
        if (text === data) {
            fs.utimesSync(fileName, new Date(), new Date());
            return;
        }
        try {
            console.log("Writing " + fileName);
            ts.sys.writeFile(fileName, data, false);
        } catch (e) {
            if (onError) {
                onError(e.message);
            }
        }
    }
    function resolveModuleName(moduleName: string, containingFile: string): ts.ResolvedModule {
        if (moduleName.substr(0, 1) === '.') {
            let res = moduleName + ".ts";
            return { resolvedFileName: res };
        }
        return null;
    }
    return {
        getSourceFile: getSourceFile,
        getDefaultLibFileName: function(options) { return defaultLibFilename; },
        writeFile: writeFile,
        getCurrentDirectory: function() { return currentDirectory; },
        useCaseSensitiveFileNames: function() { return ts.sys.useCaseSensitiveFileNames; },
        getCanonicalFileName: getCanonicalFileName,
        getNewLine: function() { return '\n'; },
        fileExists(fileName: string): boolean {
            try {
                return fs.statSync(path.join(currentDirectory, fileName)).isFile();
            } catch (e) {
                return false;
            }
        },
        readFile(fileName: string): string {
            return fs.readFileSync(path.join(currentDirectory, fileName)).toString();
        },
        resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
            return moduleNames.map((n) => {
                return resolveModuleName(n, containingFile);
            });
        }
    };
}