import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { base64ToBlob, base64ToFile, blobToBase64 } from './utils';

const self = global as any;

const SAMPLE_TXT = uniqueId(32);
const SAMPLE_B64 = btoa(SAMPLE_TXT);

describe('file-storage/utils', () => {
    beforeEach(() => {
        self.EXTENSION_BUILD = false;
    });

    describe('blobToBase64', () => {
        test('converts blob to base64', async () => {
            const blob = new Blob([SAMPLE_TXT], { type: 'text/plain' });
            const result = await blobToBase64(blob);
            const resultBlob = base64ToBlob(result);
            const text = await resultBlob.text();

            expect(text).toBe(SAMPLE_TXT);
        });
    });

    describe('base64ToBlob', () => {
        test('converts base64 to blob', async () => {
            const result = base64ToBlob(SAMPLE_B64);
            const text = await result.text();

            expect(result).toBeInstanceOf(Blob);
            expect(text).toBe(SAMPLE_TXT);
        });
    });

    describe('base64ToFile', () => {
        test('converts base64 to file with correct props', async () => {
            const filename = 'test.txt';
            const mimeType = 'text/plain';
            const result = base64ToFile(SAMPLE_B64, filename, mimeType);
            const text = await result.text();

            expect(result).toBeInstanceOf(File);
            expect(result.name).toBe(filename);
            expect(result.type).toBe(mimeType);
            expect(text).toBe(SAMPLE_TXT);
        });
    });
});
