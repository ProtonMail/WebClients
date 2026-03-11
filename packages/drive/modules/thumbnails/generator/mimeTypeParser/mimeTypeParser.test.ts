import { mimeTypeFromFile } from './mimeTypeParser';

describe('mimeTypeFromFile', () => {
    describe('Fallback chain', () => {
        test('Level 1: Uses type when available', async () => {
            expect(await mimeTypeFromFile({ type: 'image/jpeg', name: 'test.jpg' })).toEqual('image/jpeg');
        });

        test('Level 1: Prefers type over extension detection', async () => {
            expect(await mimeTypeFromFile({ type: 'image/png', name: 'test.jpg' })).toEqual('image/png');
        });

        test('Level 2: Falls back to mimetypeFromExtension() when type is empty', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'test.jxl' })).toEqual('image/jxl');
        });

        test('Level 2: Uses mimetypeFromExtension() for common extensions', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'test.webp' })).toEqual('image/webp');
        });

        test('Level 3: Falls back to getRAWMimeTypeFromName() for RAW extensions', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'test.nef' })).toEqual('image/x-nikon-nef');
        });

        test('Level 3: Detects Canon CR2 RAW format', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'IMG_1234.CR2' })).toEqual('image/x-canon-cr2');
        });

        test('Level 3: Detects Sony ARW RAW format', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'DSC_5678.arw' })).toEqual('image/x-sony-arw');
        });

        test('Level 4: Uses default mime type when no detection method works', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'test.unknownextension' })).toEqual(
                'application/octet-stream'
            );
        });

        test('Level 4: Fallback for file with no extension', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'testfile' })).toEqual('application/octet-stream');
        });
    });

    describe('Real world scenarios', () => {
        test('Correctly identifies video files', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'video.mp4' })).toEqual('video/mp4');
        });

        test('Correctly identifies PDF files', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'document.pdf' })).toEqual('application/pdf');
        });

        test('Handles files with uppercase extensions', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'photo.JPG' })).toEqual('image/jpeg');
        });

        test('Handles files with multiple dots in name', async () => {
            expect(await mimeTypeFromFile({ type: '', name: 'my.file.name.png' })).toEqual('image/png');
        });
    });
});
