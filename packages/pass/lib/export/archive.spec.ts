import { decryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { archivePath, createArchive, createExportDataStream, getArchiveName } from '@proton/pass/lib/export/archive';
import type { ExportData } from '@proton/pass/lib/export/types';
import { consumeStream } from '@proton/pass/lib/file-attachments/download';
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import { ContentFormatVersion, ItemState } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

const getMockExport = (): ExportData => ({
    version: '5.0.0.99',
    vaults: {
        [uniqueId()]: {
            name: 'Default vault',
            description: 'This is my super secret test vault',
            display: {},
            items: [
                {
                    itemId: uniqueId(),
                    shareId: uniqueId(),
                    state: ItemState.Active,
                    data: {
                        type: 'note',
                        metadata: {
                            name: 'Note',
                            note: 'This is a test note',
                            itemUuid: uniqueId(),
                        },
                        content: {},
                        platformSpecific: {},
                        extraFields: [],
                    },
                    contentFormatVersion: ContentFormatVersion.Item,
                    pinned: false,
                    aliasEmail: null,
                    createTime: getEpoch(),
                    modifyTime: getEpoch() + 100,
                    shareCount: 0,
                    files: [],
                },
            ],
        },
    },
});

describe('Archive generation', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    describe('archivePath', () => {
        test.each([
            ['file.txt', undefined, `${PASS_APP_NAME}/file.txt`],
            ['file.txt', 'subfolder', `${PASS_APP_NAME}/subfolder/file.txt`],
            ['file/with/slashes.txt', 'subfolder', `${PASS_APP_NAME}/subfolder/file_with_slashes.txt`],
            ['file\\with\\backslashes.txt', 'subfolder', `${PASS_APP_NAME}/subfolder/file_with_backslashes.txt`],
        ])('should format path correctly for %s with subpath %s', (filename, subpath, expected) => {
            expect(archivePath(filename, subpath)).toBe(expected);
        });
    });

    describe('getArchiveName', () => {
        test('should generate correct archive name format', () => {
            const mockDate = new Date('2023-01-15T12:34:56Z');
            const date = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);
            expect(getArchiveName('zip')).toBe(`${PASS_APP_NAME}_export_2023-01-15_1673786096.zip`);
            date.mockRestore();
        });
    });

    describe('`makeArchive`', () => {
        test('should correctly write unencrypted archive', async () => {
            const { signal } = new AbortController();
            const exportData = getMockExport();

            const dataStream = createExportDataStream(() => exportData, {
                encrypted: false,
                files: {},
            });

            const archive = await createArchive([dataStream], signal);
            const zipBuffer = await consumeStream(archive, signal);
            const file = new File([zipBuffer], 'archive.zip');

            const zipReader = await readZIP(file);

            expect(zipReader.files.has(archivePath('data.json'))).toBe(true);
            expect(zipReader.files.has(archivePath('data.pgp'))).toBe(false);

            const data = await zipReader.getFile(archivePath('data.json'));
            expect(data).toBeDefined();

            const json = JSON.parse(await data!.text());
            expect(json).toEqual(exportData);
        });

        test('should correctly write encrypted archive', async () => {
            const { signal } = new AbortController();
            const exportData = getMockExport();

            const dataStream = createExportDataStream(() => exportData, {
                encrypted: true,
                passphrase: 'p4ssphr3se',
                files: {},
            });

            const archive = await createArchive([dataStream], signal);
            const zipBuffer = await consumeStream(archive, signal);
            const file = new File([zipBuffer], 'archive.zip');

            const zipReader = await readZIP(file);

            expect(zipReader.files.has(archivePath('data.json'))).toBe(false);
            expect(zipReader.files.has(archivePath('data.pgp'))).toBe(true);

            const data = await zipReader.getFile(archivePath('data.pgp'));
            expect(data).toBeDefined();

            const armored = await data!.text();
            const decrypted = await decryptPassExport(armored, 'p4ssphr3se');
            const json = JSON.parse(uint8ArrayToString(decrypted));

            expect(json).toEqual(exportData);
        });
    });
});
