import * as ts from 'typescript';

export interface INodeVisitor {
    accept(n: ts.Node): boolean;
    visit(n: ts.Node): void;
}

export interface IStateFieldData {
    name: string
    type: string
    isState?: boolean
    isArray?: boolean
}

export interface IStateData {
    typeName: string;
    type: ts.SyntaxKind;
    fileName: string;
    fields: IStateFieldData[];
    heritages: string[];
    source: StateSource;
    genericTypeName?: string;
}

export enum StateSource {
    cls,
    iface
}

export interface IImportData {
    prefix: string
    relativePath: string
    fullPath: string
}

export interface IEnumData {
    name: string
}

export interface ICustomTypeData {
    name: string
}

export interface IStateSourceData {
    sourceFile: ts.SourceFile
    sourceDeps: [string, string][]
    filePath: string
    fileName: string
    states: IStateData[],
    imports: IImportData[],
    enums: IEnumData[],
    customTypes: ICustomTypeData[],
    fluxImportAlias: string
}