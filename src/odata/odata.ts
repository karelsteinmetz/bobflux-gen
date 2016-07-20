import * as log from '../logger';
import * as url from 'url';
import * as http from 'http';
import * as xml2js from 'xml2js';

export interface IOdataApiGenerator {
    run: (odataMetadataUrl: string) => void;
}

export function create(logger: log.ILogger): IOdataApiGenerator {
    return {
        run: (odataMetadataUrl) => {
            downloadMetadata(odataMetadataUrl)
                .then(xml => {
                    logger.debug("Downloaded xml:");
                    logger.debug(xml);

                    convertXmlToObject(xml)
                        .then(obj => {
                            logger.debug("Xml converted to object:");
                            logger.debug(JSON.stringify(obj));
                        })
                });
        }
    }
}

function convertXmlToObject(xml: string): Promise<any> {
    return new Promise<any>((f, r) => {
        let p = new xml2js.Parser();
        p.parseString(xml, (err, result) => {
            if (err)
                r();
            else
                f(result);
        })
    })

}

function downloadMetadata(odataMetadataUrl: string): Promise<string> {
    return new Promise<string>((f, r) => {
        let parsedUrl = url.parse(odataMetadataUrl);
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