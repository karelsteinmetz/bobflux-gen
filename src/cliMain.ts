import * as c from 'commander';
import * as ts from 'typescript';
import * as g from './generator';
import * as cg from './cursorsGenerator';
import * as bg from './buildersGenrator';
import * as og from './odata/odata';
import * as tsa from './tsAnalyzer';
import * as log from  './logger';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export function run(version: string) {
    c
        .command("odata")
        .alias("o")
        .description("generates odata api in typescript")
        .option("-u, --metadataUlr <metadataUlr>", "defines odata metadata url")
        .option("-d, --debug <1/0>", "enables logging in debug level", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .action(o => {
            let logger = humanTrue(o.debug)
                ? log.create(true, true, true, true)
                : log.create()
            logger.info('Odata api generator started');
            og.create(logger).run(o.metadataUlr);
            logger.info('Cursors generator finished');
        });
    c
        .command("cursors")
        .alias("c")
        .description("generates cursors for each state")
        .option("-p, --appStatePath <appStatePath>", "defines pattren for state files search (default is ./state.ts)")
        .option("-n, --appStateName <appStateName>", "defines root name of Application state (default is IApplicationState)")
        .option("-k, --parentStateKey <parentStateKey>", "defines key of parent state, it's suitable for nested states (default is empty)")
        .option("-r, --recursively <1/0>", "enables recursively generation for nested states", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .option("-d, --debug <1/0>", "enables logging in debug level", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .action((o) => {
            let logger = humanTrue(o.debug)
                ? log.create(true, true, true, true)
                : log.create()
            if (o.parentStateKey)
                logger.info(`Parent state cursor key '${o.parentStateKey}' has been set`);
            logger.info('Cursors generator started');
            if (humanTrue(o.recursively)) {
                logger.info('Recurse generation has been set');
                cg.default(createProjectFromDir(version, logger, currentDirectory(), o.appStatePath, o.appStateName), tsa.create(logger), logger, o.parentStateKey)
                    .runRecurse()
                    .then(r => logger.info('Cursors generator finished'))
            }
            else
                cg.default(createProjectFromDir(version, logger, currentDirectory(), o.appStatePath, o.appStateName), tsa.create(logger), logger, o.parentStateKey)
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
        .option("-k, --parentStateKey <parentStateKey>", "defines key of parent state, it's suitable for nested states (default is empty)")
        .option("-d, --debug <1/0>", "enables logging in debug level", /^(true|false|1|0|t|f|y|n)$/i, "0")
        .action((o) => {
            let logger = humanTrue(o.debug)
                ? log.create(true, true, true, true)
                : log.create();
            if (o.parentStateKey)
                logger.info(`Parent state cursor key '${o.parentStateKey}' has been set`);
            logger.info('Builders generator started');
            if (humanTrue(o.recursively)) {
                logger.info('Recurse generation has been set');
                bg.default(createProjectFromDir(version, logger, currentDirectory(), o.appStatePath, o.appStateName, o.specRelativePath), tsa.create(logger), logger, o.parentStateKey)
                    .runRecurse()
                    .then(r => logger.info('Builders generator finished'))
                    .catch(e => logger.error('Builders generator finished with errors: ', e));
            }
            else
                bg.default(createProjectFromDir(version, logger, currentDirectory(), o.appStatePath, o.appStateName, o.specRelativePath), tsa.create(logger), logger, o.parentStateKey)
                    .run()
                    .then(r => logger.info('Builders generator finished'))
                    .catch(e => logger.error('Builders generator finished with errors: ', e));
        });
    c.command('*', null, { noHelp: true }).action((com) => {
        console.log('Invalid command: ' + com);
    });
    c.parse(process.argv);
}

export function createProjectFromDir(version: string, logger: log.ILogger, dirPath: string, appStatePath: string = path.join(__dirname, './state.ts'), appStateName: string = 'IApplicationState', relativePath: string = null): g.IGenerationProject {
    let statePath = path.normalize(appStatePath.replace(/\\/g, '/'));
    console.log('statePath: ', statePath);
    return {
        version: version,
        dir: dirPath.replace(/\\/g, '/'),
        appStateName: appStateName,
        appSourcesDirectory: path.dirname(statePath),
        appStateFileName: path.basename(statePath),
        tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
        relativePath: relativePath,
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


function humanTrue(val: string): boolean {
    return /^(true|1|t|y)$/i.test(val);
}