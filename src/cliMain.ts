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
        .option("-p, --appStatePath <appStatePath>", "defines pattren for state files search (default is ./state.ts)")
        .option("-n, --appStateName <appStateName>", "defines root name of Application state (default is IApplicationState)")
        .option("-k, --parentStateKey <parentStateKey>", "defines key of parent state, it's suitable for nested states (default is empty)")
        .option("-r, --recursively <1/0>", "enables recursively generation for nested states", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .action((o) => {
            if (o.parentStateKey)
                logger.info(`Parent state cursor key '${o.parentStateKey}' has been set`);
            logger.info('Cursors generator started');
            if (humanTrue(o.recursively)) {
                logger.info('Recurse generation has been set');
                cg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName), tsa.create(logger), logger, o.parentStateKey)
                    .runRecurse()
                    .then(r => logger.info('Cursors generator finished'))
            }
            else
                cg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName), tsa.create(logger), logger, o.parentStateKey)
                    .run()
                    .then(r => logger.info('Cursors generator finished'))
                    .catch(e => logger.error('Cursors generator finished with errors: ', e));
        });
    c
        .command("builders")
        .alias("b")
        .description("generates builders for each state")
        .option("-p, --appStatePath <appStatePath>", "defines pattren for state files search (default is ./state.ts)")
        .option("-n, --appStateName <appStateName>", "defines root name of Application state (default is IApplicationState)")
        .option("-s, --specRelativePath <specRelativePath>", "defines spec directory relative path from appStatePath (default is next to states)")
        .option("-r, --recursively <1/0>", "enables recursively generation for nested states", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .action((o) => {
            logger.info('Builders generator started');
            if (humanTrue(o.recursively)) {
                logger.info('Recurse generation has been set');
                bg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName, o.specRelativePath), tsa.create(logger), logger)
                    .runRecurse()
                    .then(r => logger.info('Builders generator finished'))
            }
            bg.default(createProjectFromDir(logger, currentDirectory(), o.appStatePath, o.appStateName, o.specRelativePath), tsa.create(logger), logger)
                .run()
                .then(r => logger.info('Builders generator finished'))
                .catch(e => logger.error('Builders generator finished with errors: ', e));
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