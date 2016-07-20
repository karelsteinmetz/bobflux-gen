import * as log from '../logger';
import * as url from 'url';
import * as http from 'http';
import * as odataSchema from './odataSchema';
import * as t from './templates';
import * as typeConvertor from './odataTypeConvertor';
import * as ts from 'typescript';

export interface IOdataApiGenerator {
    run: (odataMetadataUrl: string) => void;
}

const indentSpaces = '    ';
const moduleName = 'Some.Models';
const apiServiceAlias = 'a';
const apiServiceModuleName = 'axios';

export function create(logger: log.ILogger, writeCallback: (b: Buffer) => void): IOdataApiGenerator {
    return {
        run: (odataMetadataUrl) => {
            let parsedUrl = url.parse(odataMetadataUrl);
            downloadMetadata(parsedUrl)
                .then(xml => {
                    logger.debug('Downloaded xml:');
                    logger.debug(xml);
                    odataSchema.fromXml(xml)
                        .then(obj => {
                            logger.debug('Xml converted to object:');
                            obj.edmxEdmx.edmxDataServices.forEach(ds => {
                                writeCallback(new Buffer(
                                    [
                                        t.apiServiceToString(apiServiceAlias, apiServiceModuleName),
                                        t.moduleToString('', {
                                            name: moduleName,
                                            content: createContent(ds, parsedUrl.path.replace('$metadata', ''), apiServiceAlias, moduleName)
                                        })
                                    ].join(''),
                                    'utf-8'))
                            })
                        });
                })
        }
    }
}

function createContent(ds: odataSchema.IOdataDataService, apiPath: string, apiServiceAlias: string, moduleName: string) {
    return ds.Schema.map(sch => {
        return odataSchema.isIOdataEntityTypeSchema(sch)
            ? sch.EntityType.map(e => {
                return t.interfaceToString(indentSpaces, {
                    name: e.$.Name,
                    isExported: true,
                    properties: e.Property.map(p => <t.IInterfacePropertyDefinition>{
                        name: p.$.Name,
                        valueName: ts.tokenToString(typeConvertor.EdmInt32ToTs(p.$.Type))
                    })
                });
            }).join('')
            : odataSchema.isIOdataEntitySetSchema(sch)
                ? t.apiGetResponse(indentSpaces) + sch.EntityContainer
                    .map(ec => ec.EntitySet
                        .map(e => {
                            return t.apiGet(indentSpaces, {
                                apiServiceAlias,
                                apiPrefix: apiPath,
                                entitySet: e.$.Name,
                                entityTypeName: e.$.EntityType.replace(moduleName + '.', '')
                            })
                        }).join('')
                    ).join('')
                : ''
    }).join('');
}

function downloadMetadata(parsedUrl: url.Url): Promise<string> {
    return new Promise<string>((f, r) => {
        let options = {
            host: parsedUrl.hostname,
            path: parsedUrl.path,
            port: Number(parsedUrl.port),
            method: 'GET'
        };

        let callback = function (response) {
            var str = ''
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                f(str);
            });
        }

        var req = http.request(options, callback);
        req.end();
    });
}