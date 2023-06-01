import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import unsafeSignatures from './unsafeSignatures';

const unsafeSupported = [
    {
        name: 'ico',
        fixtures: ['fixture.ico'],
        mimeType: SupportedMimeTypes.ico,
    },
    {
        name: 'mpg',
        fixtures: ['fixture.mpg', 'fixture2.mpg', 'fixture.ps.mpg', 'fixture.sub.mpg'],
        mimeType: SupportedMimeTypes.mpg,
    },
    {
        name: 'mp2t',
        fixtures: ['fixture.mp2t'],
        mimeType: SupportedMimeTypes.mp2t,
    },
    {
        name: 'aac',
        fixtures: ['fixture-adts-mpeg2.aac', 'fixture-adts-mpeg4-2.aac', 'fixture-adts-mpeg4.aac'],
        mimeType: SupportedMimeTypes.aac,
    },
    {
        name: 'mpeg',
        fixtures: ['fixture.mp1', 'fixture.mp2', 'fixture-mpa.mp2', 'fixture-mp2l3.mp3', 'fixture-ffe3.mp3'],
        mimeType: SupportedMimeTypes.mpeg,
    },
];

describe('unsafeSignatures', () => {
    unsafeSupported.forEach((unsafe) => {
        describe(`should support ${unsafe.name}`, () => {
            unsafe.fixtures.forEach((fixture) => {
                it(fixture, async () => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await unsafeSignatures(SignatureChecker(buffer))).toEqual(unsafe.mimeType);
                });
            });
        });
    });
});
