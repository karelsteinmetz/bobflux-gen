import * as pathPlatformDependent from "path";
const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes
import * as fs from "fs";

function printIntroLine() {
    let pp = pathPlatformDependent.join(__dirname, 'package.json');
    let bbPackageJson = JSON.parse(fs.readFileSync(pp, 'utf8'));
    console.log('Bobflux-generator ' + bbPackageJson.version + ' - ' + process.cwd());
}

function run() {
    printIntroLine();
    require("./src/cliMain").run();
}

run();
