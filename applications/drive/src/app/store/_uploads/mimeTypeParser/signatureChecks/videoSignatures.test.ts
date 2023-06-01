import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import videoSignatures from './videoSignatures';

const videoSupported = [
    {
        name: 'avi',
        fixtures: ['fixture.avi'],
        mimeType: SupportedMimeTypes.avi,
    },
    {
        name: 'ogv',
        fixtures: ['fixture.ogv'],
        mimeType: SupportedMimeTypes.ogv,
    },
    {
        name: 'm4v | m4vh | m4vp',
        fixtures: ['fixture.m4v'],
        mimeType: SupportedMimeTypes.m4v,
    },
    {
        name: 'm4p | f4v | f4p',
        fixtures: ['fixture.m4p', 'fixture.f4v', 'fixture.f4p'],
        mimeType: SupportedMimeTypes.mp4v,
    },
    {
        name: '3g',
        fixtures: ['fixture.3gp', 'fixture2.3gp'],
        mimeType: SupportedMimeTypes.v3gp,
    },
    {
        name: '3g2',
        fixtures: ['fixture.3g2'],
        mimeType: SupportedMimeTypes.v3g2,
    },
    {
        name: 'mp4v',
        fixtures: [
            'fixture-imovie.mp4',
            'fixture-isom.mp4',
            'fixture-dash.mp4',
            'fixture-isomv2.mp4',
            'fixture-mp4v2.mp4',
        ],
        mimeType: SupportedMimeTypes.mp4v,
    },
];

describe('videoSignatures', () => {
    videoSupported.forEach((video) => {
        it(`should support ${video.name}`, async () => {
            await Promise.all(
                video.fixtures.map(async (fixture) => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await videoSignatures(SignatureChecker(buffer))).toEqual(video.mimeType);
                })
            );
        });
    });
});
