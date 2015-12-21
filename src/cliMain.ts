import * as c from 'commander';
import * as ts from 'typescript';
import * as g from './generator';
import * as cg from './cursorsGenerator';
import * as fs from 'fs';
import * as path from 'path';

export function run() {
    c
        .command("cursors")
        .alias("c")
        .description("generates cursors for each state")
        .option("-p, --appStatePath <appStatePath>", "define pattren for state files search (default is ./state.ts)")
        .action((c) => {
            console.log('Cursors generator started with appStatePath: ', c.appStatePath);
            cg.default(createProjectFromDir(currentDirectory(), c.appStatePath))
                .run()
                .then(r => console.log('Cursors generator finished'))
        });
    c.command('*', null, { noHelp: true }).action((com) => {
        console.log("Invalid command " + com);
    });
    c.parse(process.argv);
}

export function createProjectFromDir(dirPath: string, appStatePath: string = 'state.ts'): g.IGenerationProject {
    return {
        dir: dirPath.replace(/\\/g, '/'),
        appStateName: appStatePath,
        appSourcesDirectory: 'c:/dev-github/bobflux-gen/examples/',
        tsOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5, skipDefaultLibCheck: true },
        writeFileCallback: (filename: string, b: Buffer) => {
            let fullname = path.join('c:/dev-github/bobflux-gen/examples/', filename);
            console.log("Writing " + fullname);
            mkpathsync(path.dirname(fullname));
            fs.writeFileSync(fullname, b);
        }
    };
}

export function currentDirectory(): string {
    return process.cwd().replace(/\\/g, "/");
}

export function mkpathsync(dirpath:string) {
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
