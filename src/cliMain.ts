import * as c from 'commander';
import * as ts from 'typescript';
import * as g from './generator';
import * as cg from './cursorsGenerator';
import * as tsa from './tsAnalyzer';
import * as fs from 'fs';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export function run() {
    c
        .command("cursors")
        .alias("c")
        .description("generates cursors for each state")
        .option("-p, --appStatePath <appStatePath>", "define pattren for state files search (default is ./state.ts)")
        .option("-n, --appStateName <appStateName>", "define root name of Application state (default is IApplicationState)")
        .action((o) => {
            console.log('Cursors generator started', o);
            cg.default(createProjectFromDir(currentDirectory(), o.appStatePath, o.appStateName), tsa.create())
                .run()
                .then(r => console.log('Cursors generator finished'))
        });
    c.command('*', null, { noHelp: true }).action((com) => {
        console.log("Invalid command " + com);
    });
    c.parse(process.argv);
}

export function createProjectFromDir(dirPath: string, appStatePath: string = path.join(__dirname, './state.ts'), appStateName: string = 'IApplicationState'): g.IGenerationProject {
    let dir = path.dirname(appStatePath);
    return {
        dir: dirPath.replace(/\\/g, '/'),
        appStateName: appStateName,
        appSourcesDirectory: appStatePath,
        tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
        writeFileCallback: (filename: string, b: Buffer) => {
            let fullname = path.join(dir, filename);
            console.log("Writing started into " + fullname);
            mkpathsync(path.dirname(fullname));
            fs.writeFileSync(fullname, b);
            console.log("Writing finished");
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
