import * as fs from 'fs/promises';
import * as path from 'path';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { SignatureChecker } from '../helpers';
import archiveSignatures from './archiveSignatures';

const archiveSupported = [
    {
        name: 'x7zip',
        fixtures: ['fixture.7z'],
        mimeType: SupportedMimeTypes.x7zip,
    },
    {
        name: 'bzip2',
        fixtures: ['fixture.bz2'],
        mimeType: SupportedMimeTypes.bzip2,
    },
    {
        name: 'gzip',
        fixtures: ['fixture.tar.gz'],
        mimeType: SupportedMimeTypes.gzip,
    },
    {
        name: 'rar',
        fixtures: ['fixture.rar'],
        mimeType: SupportedMimeTypes.rar,
    },
    {
        name: 'tar',
        fixtures: ['fixture.tar', 'fixture-v7.tar', 'fixture-spaces.tar'],
        mimeType: SupportedMimeTypes.tar,
    },
    {
        name: 'zip',
        fixtures: ['fixture.zip'],
        mimeType: SupportedMimeTypes.zip,
    },
    {
        name: 'word',
        fixtures: ['fixture.docx', 'fixture2.docx', 'fixture-office365.docx'],
        mimeType: SupportedMimeTypes.docx,
    },
    {
        name: 'power-point',
        fixtures: ['fixture.pptx', 'fixture2.pptx', 'fixture-office365.pptx'],
        mimeType: SupportedMimeTypes.pptx,
    },
    {
        name: 'excel',
        fixtures: ['fixture.xlsx', 'fixture2.xlsx', 'fixture-office365.xlsx'],
        mimeType: SupportedMimeTypes.xlsx,
    },
    {
        name: 'epub',
        fixtures: ['fixture.epub'],
        mimeType: SupportedMimeTypes.epub,
    },
];

describe('archiveSignature', () => {
    archiveSupported.forEach((archive) => {
        describe(`should support ${archive.name}`, () => {
            archive.fixtures.forEach((fixture) => {
                it(fixture, async () => {
                    const buffer = await fs.readFile(path.resolve(__dirname, `./_fixtures_/${fixture}`), null);
                    expect(await archiveSignatures(SignatureChecker(buffer))).toEqual(archive.mimeType);
                });
            });
        });
    });

    // Old format, didn't found any proper way to generate a .arc archive
    it('should detect arc files', async () => {
        const arcBuffer = Buffer.from([0x41, 0x72, 0x43, 0x01]);
        expect(await archiveSignatures(SignatureChecker(arcBuffer))).toEqual(SupportedMimeTypes.arc);
    });

    describe('should not detect apple files as zip', () => {
        it('fixture.keyn (fixture.key)', async () => {
            // For this test we use a fixture.keyn file since .key files can't be pushed to remote
            // We fool the function that the real name is .key
            const buffer = await fs.readFile(path.resolve(__dirname, './_fixtures_/fixture.keyn'), null);
            expect(await archiveSignatures(SignatureChecker(buffer), 'fixture.key')).toEqual(
                SupportedMimeTypes.keynote
            );
        });
        it('fixture.numbers', async () => {
            const buffer = await fs.readFile(path.resolve(__dirname, './_fixtures_/fixture.numbers'), null);
            expect(await archiveSignatures(SignatureChecker(buffer), 'fixture.numbers')).toEqual(
                SupportedMimeTypes.numbers
            );
        });
        it('fixture.pages', async () => {
            const buffer = await fs.readFile(path.resolve(__dirname, './_fixtures_/fixture.pages'), null);
            expect(await archiveSignatures(SignatureChecker(buffer), 'fixture.pages')).toEqual(
                SupportedMimeTypes.pages
            );
        });
    });
});
