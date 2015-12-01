import * as c from 'commander';
import cursorsGenerator from './cursorsGenerator';

export function run() {
    c
        .command("cursors")
        .alias("c")
        .description("generates cursors for each state")
        .option("-p, --stateFilesPattern <stateFilesPattern>", "define pattren for state files search (default is ./**/*State.ts)")
        .action((c) => {
            console.log('Cursors generator started with pattren: ', c.stateFilesPattern);
            cursorsGenerator()
                .run()
                .then(r => console.log('Cursors generator finished'))
        });
    c.command('*', null, { noHelp: true }).action((com) => {
        console.log("Invalid command " + com);
    });
    c.parse(process.argv);
}
