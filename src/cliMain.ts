import * as c from 'commander';
import * as ts from 'typescript';
import * as g from './generator';
import * as cg from './cursorsGenerator';
import * as bg from './buildersGenrator';
import * as tsa from './tsAnalyzer';
import * as log from  './logger';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export function run() {
    let logger = log.create();
    c
        .command("cursors")
        .alias("c")
        .description("generates cursors for each state")
        .option("-p, --appStatePath <appStatePath>", "define pattren for state files search (default is ./state.ts)")
        .option("-n, --appStateName <appStateName>", "define root name of Application state (default is IApplicationState)")
        .option("-r, --recursively <1/0>", "enables recursively generation for nested states", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .action((o) => {
            let applyRecurse = false
            if (humanTrue(c["recursively"]))
                applyRecurse = true;
            logger.info('Cursors generator started');
            cg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName), tsa.create(logger), logger, applyRecurse)
                .run()
                .then(r => logger.info('Cursors generator finished'))
        });
    c
        .command("builders")
        .alias("b")
        .description("generates builders for each state")
        .option("-p, --appStatePath <appStatePath>", "defines pattren for state files search (default is ./state.ts)")
        .option("-n, --appStateName <appStateName>", "defines root name of Application state (default is IApplicationState)")
        .option("-s, --specRelativePath <specRelativePath>", "defines spec directory relative path from appStatePath (default is next to states)")
        .action((o) => {
            logger.info('Builders generator started');
            bg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName, o.specRelativePath), tsa.create(logger), logger)
                .run()
                .then(r => logger.info('Builders generator finished'))
        });
    c.command('*', null, { noHelp: true }).action((com) => {
        logger.info('Invalid command: ' + com);
    });
    c.parse(process.argv);
}

export function createProjectFromDir(logger: log.ILogger, dirPath: string, appStatePath: string = path.join(__dirname, './state.ts'), appStateName: string = 'IApplicationState', relativePath: string = null): g.IGenerationProject {
    let statePath = path.normalize(appStatePath.replace(/\\/g, '/'));
    return {
        dir: dirPath.replace(/\\/g, '/'),
        appStateName: appStateName,
        appSourcesDirectory: path.dirname(statePath),
        appStateFileName: path.basename(statePath),
        tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
        relativePath: relativePath,
        writeFileCallback: (filename: string, b: Buffer) => {
            if (relativePath)
                filename = path.join(path.dirname(filename), relativePath, path.basename(filename));
            logger.info("Writing started into " + filename);
            mkpathsync(path.dirname(filename));
            fs.writeFileSync(filename, b);
            logger.info("Writing finished");
        }
    };
}

export function currentDirectory(): string {
    return process.cwd().replace(/\\/g, "/");
}

export function mkpathsync(dirpath: string) {
    try {
        if (!fs.statSync(dirpath).isDirectory()) {
            throw new Error(dirpath + ' exists and is not a directory');
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            mkpathsync(path.dirname(dirpath));
            fs.mkdirSync(dirpath);
        } else {
            throw err;
        }
    }
};


function humanTrue(val: string): boolean {
    return /^(true|1|t|y)$/i.test(val);
}