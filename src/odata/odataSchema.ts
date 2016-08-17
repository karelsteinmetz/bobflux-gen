import * as xml2js from 'xml2js';

function sanitizeName(name) {
    return name.replace(":", "");
}

export function fromXml(xml: string): Promise<IOdata> {
    return new Promise<IOdata>((f, r) => {
        let p = new xml2js.Parser({
            tagNameProcessors: [sanitizeName],
            attrNameProcessors: [sanitizeName],
            // valueProcessors: [sanitizeName],
            // attrValueProcessors: [sanitizeName]
        });
        p.parseString(xml, (err, result) => {
            if (err)
                r();
            else
                f(result);
        }
        );
    });
}

export interface IOdata {
    edmxEdmx: IOdataEdmx;
}

export interface IOdataEdmx {
    $: IOdataXmlns;
    edmxDataServices: IOdataDataService[];
}

export interface IOdataXmlns {
    Version: string;
    xmlnsEdmx: string;
}

export interface IOdataDataService {
    Schema: (IOdataSchemaBase | IOdataEntityTypeSchema | IOdataEntitySetSchema)[];
}

export function isIOdataEntityTypeSchema(obj: IOdataSchemaBase | IOdataEntityTypeSchema | IOdataEntitySetSchema): obj is IOdataEntityTypeSchema {
    return 'EntityType' in obj;
}

export function isIOdataEntitySetSchema(obj: IOdataSchemaBase | IOdataEntityTypeSchema | IOdataEntitySetSchema): obj is IOdataEntitySetSchema {
    return 'EntityContainer' in obj;
}

export interface IOdataSchemaBase {
    $: { Namespace: string, xmlns: string };
}

export interface IOdataEntityTypeSchema extends IOdataSchemaBase {
    EntityType: IOdataEntityType[];
}

export interface IOdataEntityType {
    $: { Name: string };
    Key: IOdataEntityTypeKey[];
    Property: IOdataEntityTypeProperty[];
}

export interface IOdataEntityTypeKey {
    PropertyRef: { $: { Name: string } };
}

export interface IOdataEntityTypeProperty {
    $: IOdataEntityTypePropertyItem;
}

export interface IOdataEntityTypePropertyItem {
    Name: string,
    Type: string,
    Nullable?: string
}

export interface IOdataEntitySetSchema extends IOdataSchemaBase {
    EntityContainer: IOdataEntityContainer[];
}

export interface IOdataEntityContainer {
    $: { Name: string };
    EntitySet: IOdataEntitySet[];
}

export interface IOdataEntitySet {
    $: IOdataEntitySetItem;
}

export interface IOdataEntitySetItem {
    Name: string;
    EntityType: string;
}