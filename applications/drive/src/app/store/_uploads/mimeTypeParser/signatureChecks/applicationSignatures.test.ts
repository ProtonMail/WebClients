import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import applicationSignatures from './applicationSignatures';

const applicationSupported = [
    {
        name: 'swf',
        fixtures: ['fixture.swf', 'fixture-cws.swf'],
        mimeType: SupportedMimeTypes.swf,
    },
    {
        name: 'flv',
        fixtures: ['fixture.flv'],
        mimeType: SupportedMimeTypes.flv,
    },
    {
        name: 'ogg',
        fixtures: ['fixture.ogg'],
        mimeType: SupportedMimeTypes.ogg,
    },
    {
        name: 'pdf',
        fixtures: [
            'fixture.pdf',
            'fixture-adobe-illustrator.pdf',
            'fixture-fast-web.pdf',
            'fixture-printed.pdf',
            'fixture-smallest.pdf',
        ],
        mimeType: SupportedMimeTypes.pdf,
    },
    {
        name: 'rtf',
        fixtures: ['fixture.rtf'],
        mimeType: SupportedMimeTypes.rtf,
    },
    {
        name: 'xml',
        fixtures: ['fixture.xml'],
        mimeType: SupportedMimeTypes.xml,
    },
];

describe('applicationSignatures', () => {
    applicationSupported.forEach((application) => {
        describe(`should support ${application.name}`, () => {
            application.fixtures.forEach((fixture) => {
                it(fixture, async () => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await applicationSignatures(SignatureChecker(buffer))).toEqual(application.mimeType);
                });
            });
        });
    });
});
