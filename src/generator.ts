import * as ts from "typescript";

export interface IGenerationProject {
    dir: string
    appStateName: string
    appSourcesDirectory: string
    appStateFileName: string
    tsOptions: ts.CompilerOptions
    relativePath?: string
    writeFileCallback: (filename: string, b: Buffer) => void
}

export interface IGenerationProcess {
    run(): Promise<any>;
}