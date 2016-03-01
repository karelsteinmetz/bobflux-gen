import * as path from 'path';

export function normalizePath(baseDirPath: string, rootFilePath: string, relativeFilePath: string): string {
    let p = path.join(path.dirname(rootFilePath), relativeFilePath);
    return path.relative(baseDirPath || '', p);
}

export function resolveRelatioveStateFilePath(baseDirPath: string, relativePath: string) {
    return path.relative(baseDirPath, relativePath);
}

export function createBuildersFilePath(dir: string, relativeDir: string, stateFilePath: string): string {
    let name = `${path.basename(stateFilePath).replace(path.extname(stateFilePath), '')}.builders.ts`;
    let newDir = (path.parse(stateFilePath).dir + '/').replace(dir, '');
    return path.join(relativeDir, newDir, name);
}