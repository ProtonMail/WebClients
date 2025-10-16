import { isRAWExtension, isRAWPhoto } from '@proton/shared/lib/helpers/mimetype';

import { mediaTypeFromFile } from './mediaTypeParser';

describe('mediaTypeFromFile', () => {
    test('Based on File.type', async () => {
        const fileContents = new Blob(['test'], { type: 'image/jpeg' });
        const testFile = new File([fileContents], 'test.jpg', {
            type: 'image/jpeg',
        });

        expect(await mediaTypeFromFile(testFile)).toEqual('image/jpeg');
    });

    test('Based on mimetypeFromExtension()', async () => {
        const fileContents = new Blob(['test'], { type: '' });
        const testFile = new File([fileContents], 'test.jxl', {
            type: '',
        });
        expect(await mediaTypeFromFile(testFile)).toEqual('image/jxl');
    });

    test('Fallback to application/octet-stream', async () => {
        const fileContents = new Blob(['test'], { type: '' });
        const testFile = new File([fileContents], 'test.does-not-exists', {
            type: '',
        });
        expect(await mediaTypeFromFile(testFile)).toEqual('application/octet-stream');
    });
});

describe('RAW Photo Utilities', () => {
    describe('isRAWPhoto', () => {
        it('should return true for valid RAW photo MIME types', () => {
            expect(isRAWPhoto('image/x-nikon-nef')).toBe(true);
            expect(isRAWPhoto('image/x-canon-cr2')).toBe(true);
            expect(isRAWPhoto('image/x-sony-arw')).toBe(true);
            expect(isRAWPhoto('image/x-dcraw')).toBe(true);
        });

        it('should return false for non-RAW photo MIME types', () => {
            expect(isRAWPhoto('image/jpeg')).toBe(false);
            expect(isRAWPhoto('image/png')).toBe(false);
            expect(isRAWPhoto('application/pdf')).toBe(false);
            expect(isRAWPhoto('')).toBe(false);
        });

        it('should handle case sensitivity correctly', () => {
            expect(isRAWPhoto('IMAGE/X-NIKON-NEF')).toBe(false);
            expect(isRAWPhoto('image/X-Canon-CR2')).toBe(false);
        });
    });

    describe('isRAWExtension', () => {
        it('should return true for valid RAW photo extensions', () => {
            expect(isRAWExtension('nef')).toBe(true);
            expect(isRAWExtension('cr2')).toBe(true);
            expect(isRAWExtension('arw')).toBe(true);
            expect(isRAWExtension('dcraw')).toBe(true);
        });

        it('should handle uppercase extensions correctly', () => {
            expect(isRAWExtension('NEF')).toBe(true);
            expect(isRAWExtension('CR2')).toBe(true);
            expect(isRAWExtension('ArW')).toBe(true);
        });

        it('should return false for non-RAW photo extensions', () => {
            expect(isRAWExtension('jpg')).toBe(false);
            expect(isRAWExtension('png')).toBe(false);
            expect(isRAWExtension('pdf')).toBe(false);
            expect(isRAWExtension('')).toBe(false);
        });

        it('should return false for undefined extension', () => {
            expect(isRAWExtension(undefined)).toBe(false);
        });
    });
});
