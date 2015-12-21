import * as g from './generator';
import * as ts from 'typescript';
import * as fs from "fs";
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

var defaultLibFilename = path.join(path.dirname(require.resolve("typescript").replace(/\\/g, "/")), "lib.es6.d.ts");

export default (project: g.IGenerationProject): g.IGenerationProcess => {
    return {
        run: () => new Promise((f, r) => {
            console.log('Cursors generator runs in ' + project.appSourcesDirectory);
            console.log('Application state file name: ' + project.appStateName);
            let program = ts.createProgram([project.appStateName], project.tsOptions, createCompilerHost(project.appSourcesDirectory));
            let tc = program.getTypeChecker();
            const resolvePathStringLiteral = ((nn: ts.StringLiteral) => path.join(path.dirname(nn.getSourceFile().fileName), nn.text));
            let sourceFiles = program.getSourceFiles();
            // console.log('Found source files: ', sourceFiles);
            for (let i = 0; i < sourceFiles.length; i++) {
                let data = gatherSourceInfo(sourceFiles[i], tc, resolvePathStringLiteral);
                project.writeFileCallback('cursors.ts', new Buffer(
                    `import * as bf from 'bobflux';
`
                        .concat(
                        data.states
                            .map(s => s.fields
                                .map(f => {
                                    return `
export let ${f.name}Cursor: bf.ICursor<${ts.tokenToString(f.type)}> = {
    key: '${f.name}'
}`
                                })
                                .join('\n'))
                            .join('\n')),
                    'utf-8')
                )
                f();
            }
        })
    }
}

export interface IStateFieldData {
    name: string
    type: ts.SyntaxKind
}

export interface IStateData {
    typeName: string
    fields: IStateFieldData[]
}

export interface IStateSourceData {
    sourceFile: ts.SourceFile
    sourceDeps: [string, string][]
    filePath: string
    states: IStateData[]
}

export function gatherSourceInfo(source: ts.SourceFile, tc: ts.TypeChecker, resolvePathStringLiteral: (sl: ts.StringLiteral) => string): IStateSourceData {
    var result: IStateSourceData = {
        sourceFile: source,
        sourceDeps: [],
        filePath: null,
        states: []
    };
    function visit(n: ts.Node) {
        // console.log('n.kind: ', n.kind);
        if (n.kind === ts.SyntaxKind.SourceFile) { // 249
            let sf = <ts.SourceFile>n;
            result.filePath = sf.path;
        }
        if (n.kind === ts.SyntaxKind.ImportDeclaration) { //223
            let id = <ts.ImportDeclaration>n;
            let moduleSymbol = tc.getSymbolAtLocation(id.moduleSpecifier);
            let fn = moduleSymbol.valueDeclaration.getSourceFile().fileName;
            let bindings = id.importClause.namedBindings;
            result.sourceDeps.push([moduleSymbol.name, fn]);
        }
        else if (n.kind === ts.SyntaxKind.InterfaceDeclaration) { //216
            let ce = <ts.InterfaceDeclaration>n;
            result.states.push({
                typeName: ce.name.text,
                fields: []
            });
        }
        else if (n.kind === ts.SyntaxKind.PropertySignature) { //140
            let ps = <ts.PropertySignature>n;
            let iface = result.states.filter(s => ps.parent.kind === ts.SyntaxKind.InterfaceDeclaration)[0];
            iface.fields.push({ name: ps.name.getText(), type: ps.type.kind })
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
            // console.log('getSourceFile - path: ', filePath);
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