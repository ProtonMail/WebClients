import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import fontSignatures from './fontSignatures';

const fontSupported = [
    {
        name: 'woff',
        fixtures: ['fixture.woff', 'fixture-otto.woff'],
        mimeType: SupportedMimeTypes.woff,
    },
    {
        name: 'woff2',
        fixtures: ['fixture.woff2', 'fixture-otto.woff2'],
        mimeType: SupportedMimeTypes.woff2,
    },
    {
        name: 'otf',
        fixtures: ['fixture.otf'],
        mimeType: SupportedMimeTypes.otf,
    },
    {
        name: 'eot',
        fixtures: ['fixture.eot'],
        mimeType: SupportedMimeTypes.eot,
    },
    {
        name: 'ttf',
        fixtures: ['fixture.ttf'],
        mimeType: SupportedMimeTypes.ttf,
    },
];

describe('fontSignatures', () => {
    fontSupported.forEach((font) => {
        describe(`should support ${font.name}`, () => {
            font.fixtures.forEach((fixture) => {
                it(fixture, async () => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await fontSignatures(SignatureChecker(buffer))).toEqual(font.mimeType);
                });
            });
        });
    });
});
