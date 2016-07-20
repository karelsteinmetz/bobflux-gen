import * as log from '../logger';
import * as url from 'url';
import * as http from 'http';

export interface IOdataApiGenerator {
    run: (odataMetadataUrl: string) => void;
}

export function create(logger: log.ILogger): IOdataApiGenerator {
    return {
        run: (odataMetadataUrl) => {
            downloadMetadata(odataMetadataUrl)
                .then(xml => {
                    logger.info(xml);
                });
        }
    }
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