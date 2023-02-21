import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import audioSignatures from './audioSignatures';

const audioSupported = [
    {
        name: 'midi',
        fixtures: ['fixture.mid'],
        mimeType: SupportedMimeTypes.midi,
    },
    {
        name: 'flac',
        fixtures: ['fixture.flac'],
        mimeType: SupportedMimeTypes.flac,
    },
    {
        name: 'wav',
        fixtures: ['fixture.wav'],
        mimeType: SupportedMimeTypes.wav,
    },
    {
        name: 'qcp',
        fixtures: ['fixture.qcp'],
        mimeType: SupportedMimeTypes.qcp,
    },
    {
        name: 'opus',
        fixtures: ['fixture.opus'],
        mimeType: SupportedMimeTypes.opus,
    },
    {
        name: 'oga',
        fixtures: ['fixture.oga'],
        mimeType: SupportedMimeTypes.oga,
    },
    {
        name: 'm4a',
        fixtures: ['fixture-babys-songbook.m4b.m4a'],
        mimeType: SupportedMimeTypes.m4a,
    },
    {
        name: 'mp4a',
        fixtures: ['fixture.m4b', 'fixture.f4a', 'fixture.f4b'],
        mimeType: SupportedMimeTypes.mp4a,
    },
];

describe('audioSignatures', () => {
    audioSupported.forEach((audio) => {
        describe(`should support ${audio.name}`, () => {
            audio.fixtures.forEach((fixture) => {
                it(fixture, async () => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await audioSignatures(SignatureChecker(buffer))).toEqual(audio.mimeType);
                });
            });
        });
    });
});
