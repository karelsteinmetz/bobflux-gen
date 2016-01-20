import * as c from 'commander';
import * as ts from 'typescript';
import * as g from './generator';
import * as cg from './cursorsGenerator';
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
        .action((o) => {
            logger.info('Cursors generator started');
            cg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName), tsa.create(logger), logger)
                .run()
                .then(r => logger.info('Cursors generator finished'))
        });
    c.command('*', null, { noHelp: true }).action((com) => {
        logger.info('Invalid command: ' + com);
    });
    c.parse(process.argv);
}

export function createProjectFromDir(logger: log.ILogger, dirPath: string, appStatePath: string = path.join(__dirname, './state.ts'), appStateName: string = 'IApplicationState'): g.IGenerationProject {
    let dir = path.dirname(appStatePath);
    return {
        dir: dirPath.replace(/\\/g, '/'),
        appStateName: appStateName,
        appSourcesDirectory: dir,
        appStateFileName: path.basename(appStatePath),
        tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
        writeFileCallback: (filename: string, b: Buffer) => {
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
