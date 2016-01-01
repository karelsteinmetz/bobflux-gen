import * as g from './generator';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

var defaultLibFilename = path.join(path.dirname(require.resolve("typescript").replace(/\\/g, "/")), "lib.es6.d.ts");

var lastLibPrecompiled;
export function createCompilerHost(currentDirectory): ts.CompilerHost {
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