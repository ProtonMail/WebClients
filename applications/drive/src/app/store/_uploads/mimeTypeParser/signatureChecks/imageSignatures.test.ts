import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import imageSignatures from './imageSignatures';

const imageSupported = [
    {
        name: 'webp',
        fixtures: ['fixture.webp'],
        mimeType: SupportedMimeTypes.webp,
    },
    {
        name: 'tiff',
        fixtures: ['fixture-bali.tif', 'fixture-big-endian.tif', 'fixture-little-endian.tif'],
        mimeType: SupportedMimeTypes.tiff,
    },
    {
        name: 'gif',
        fixtures: ['fixture.gif'],
        mimeType: SupportedMimeTypes.gif,
    },
    {
        name: 'jpg',
        fixtures: ['fixture.jpg'],
        mimeType: SupportedMimeTypes.jpg,
    },
    {
        name: 'bmp',
        fixtures: ['fixture.bmp'],
        mimeType: SupportedMimeTypes.bmp,
    },
    {
        name: 'avif',
        fixtures: ['fixture-sequence.avif', 'fixture-yuv420-8bit.avif'],
        mimeType: SupportedMimeTypes.avif,
    },
    {
        name: 'heif',
        fixtures: ['fixture-mif1.heic'],
        mimeType: SupportedMimeTypes.heif,
    },
    {
        name: 'heifs',
        fixtures: ['fixture-msf1.heic'],
        mimeType: SupportedMimeTypes.heifs,
    },
    {
        name: 'heic | heix',
        fixtures: ['fixture-heic.heic'],
        mimeType: SupportedMimeTypes.heic,
    },
    // {
    //     name: 'heics | hevc',
    //     fixtures: ['fixture.heics', 'fixture.hevc'],
    //     mimeType: SupportedMimeTypes.heics,
    // },
    {
        name: 'crx',
        fixtures: ['fixture.cr3'],
        mimeType: SupportedMimeTypes.cr3,
    },
];

describe('imageSignatures', () => {
    imageSupported.forEach((image) => {
        describe(`should support ${image.name}`, () => {
            image.fixtures.forEach((fixture) => {
                it(fixture, async () => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await imageSignatures(SignatureChecker(buffer))).toEqual(image.mimeType);
                });
            });
        });
    });
});
