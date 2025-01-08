#!/usr/bin/env tsx
import type { OpenAPIV3 } from 'openapi-types';
import prettier from 'prettier';

import { generateTypes } from './generator/any';
import { generatePaths } from './generator/paths';

/** Redocly stores the OpenAPI JSON inlined in the HTML
 * page as a script tag. Extract it from raw source */
export const resolveDocument = async (redoclyURL: string): Promise<OpenAPIV3.Document> => {
    try {
        const res = await fetch(redoclyURL);
        const txt = await res.text();
        const re = /const data = ({[^]*?});/;
        const document = txt.match(re);

        if (!document) throw new Error('No documents found');
        return JSON.parse(document[1]) as OpenAPIV3.Document;
    } catch (err) {
        console.warn('Could not resolve OpenAPI document', err);
        throw err;
    }
};

void (async () => {
    const url = process.argv[2];

    if (!url) {
        process.stderr.write('Please provide a Redocly URL as an argument');
        process.exit(1);
    }

    const doc = await resolveDocument(url);
    const types = generateTypes(doc);
    const paths = generatePaths(doc);
    const raw = [types, ...paths].join('');

    const output = await prettier.format(raw, {
        parser: 'typescript',
        printWidth: 120,
        semi: true,
        bracketSpacing: true,
        experimentalTernaries: true,
    });

    await new Promise<void>((resolve, reject) => {
        process.stdout.write(output, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    process.exit(0);
})();
