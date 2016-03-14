import * as pathPlatformDependent from "path";
const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes
import * as fs from "fs";

function loadVersion(): string {
    let pp = pathPlatformDependent.join(__dirname, 'package.json');
    let bbPackageJson = JSON.parse(fs.readFileSync(pp, 'utf8'));
    return bbPackageJson.version;
}

function printIntroLine(version: string) {
    console.log('Bobflux-generator ' + version + ' - ' + process.cwd());
}

function run() {
    let version = loadVersion();
    printIntroLine(version);
    require("./src/cliMain").run(version);
}

run();
