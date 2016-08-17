export function apiServiceToString(alias: string, nodeModule: string): string {
    return `import * as ${alias} from '${nodeModule}';`
}


export interface IModuleDefinition {
    name: string;
    content: string;
}

export function moduleToString(indent: string, def: IModuleDefinition): string {
    return `
${indent}export module ${def.name} {
${indent}    ${def.content}
${indent}}`
}

export interface IInterfaceDefinition {
    name: string;
    properties: IInterfacePropertyDefinition[];
    isExported?: boolean;
}

export interface IInterfacePropertyDefinition {
    name: string;
    valueName: string;
}

export function interfaceToString(indent: string, def: IInterfaceDefinition): string {
    return `
${indent}${!!def.isExported ? 'export' : ''} interface I${def.name} {
${indent}    ${def.properties.map(p => `${p.name}: ${p.valueName};`).join(`\n${indent}${indent}`)}
${indent}}`
}

export function apiGetResponse(indent: string): string {
    return `
${indent}export interface IGetResponse<T> {
${indent}    data: T[];
${indent}    totalRowsCount: number;
${indent}}   
    `;
}

export interface IApiDefinition {
    apiServiceAlias: string;
    apiPrefix: string;
    entitySet: string;
    entityTypeName: string;
}

export function apiGet(indent: string, def: IApiDefinition): string {
    return `
${indent}export const get${def.entitySet} = (): Promise<IGetResponse<I${def.entityTypeName}>> => {
${indent}    return new Promise<IGetResponse<I${def.entityTypeName}>>((f, r) => {
${indent}        ${def.apiServiceAlias}.get('${def.apiPrefix}${def.entitySet}')
${indent}            .then(response => {
${indent}                f({ data: response.data['value'], totalRowsCount: response.data['@odata.count'] });
${indent}            })
${indent}            .catch(error => {
${indent}                r(error);
${indent}            });
${indent}    });
${indent}}
`;
}

