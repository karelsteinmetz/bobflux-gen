import * as ts from 'typescript';

export interface INodeVisitor {
    accept(n: ts.Node): boolean;
    visit(n: ts.Node): void;
}

export interface IStateFieldData {
    name: string;
    type: string;
    isState?: boolean;
    isArray?: boolean;
    typeArguments?: string[];
}

export interface IStateData {
    typeName: string;
    type: ts.SyntaxKind;
    fileName: string;
    fields: IStateFieldData[];
    heritages: string[];
    source: StateSource;
    typeArguments?: string[];
}

export enum StateSource {
    iface,
    cls
}

export interface IImportData {
    prefix: string;
    relativePath: string;
    fullPath: string;
    types: INamedImportData[];
}

export interface INamedImportData {
    sourceType: string;
    targetType: string;
}

export interface IEnumData {
    name: string
}

export interface ICustomTypeData {
    name: string
}

export interface IStateSourceData {
    sourceFile: ts.SourceFile;
    sourceDeps: { [type: string]: IImportData };
    filePath: string;
    fileName: string;
    states: IStateData[];
    imports: IImportData[];
    enums: IEnumData[];
    customTypes: ICustomTypeData[];
}

export function flatten<T>(array: T[][]): T[] { return [].concat(...array); }
