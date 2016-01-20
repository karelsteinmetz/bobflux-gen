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
            logger.info('Builders generator runs in: ' + project.appSourcesDirectory);
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
                    let cursorsFile = `${path.join(path.dirname(sourceFile.path), path.basename(sourceFile.fileName).replace(path.extname(sourceFile.fileName), ''))}.builders.ts`;
                    project.writeFileCallback(cursorsFile, new Buffer(fileContent, 'utf-8'))
                }
            }
            f();
        })
    }
}

type PrefixMap = { [stateName: string]: string };

function createText(data: tsa.IStateSourceData, mainStateName: string): string {
    return 'There will be builders.';
}