import * as ts from 'typescript';
import * as nv from './nodeVisitor';
import * as pathPlatformDependent from 'path';

const path = pathPlatformDependent.posix; // This works everythere, just use forward slashes

export function create(saveCallback: (sourceFile: { filePath: string, fileName: string }) => void): nv.INodeVisitor {
    return {
        accept: (n: ts.Node): boolean => {
            return n.kind === ts.SyntaxKind.SourceFile;
        },
        visit: (sf: ts.SourceFile) => {
            saveCallback({
                filePath: sf.path,
                fileName: path.basename(sf.fileName, '.ts')
            });
        }
    }
}