import { mimeTypeFromFile } from './mimeTypeParser';

describe('mimeTypeFromFile', () => {
    test('Based on File.type', async () => {
        const fileContents = new Blob(['test'], { type: 'image/jpeg' });
        const testFile = new File([fileContents], 'test.jpg', {
            type: 'image/jpeg',
        });

        expect(await mimeTypeFromFile(testFile)).toEqual('image/jpeg');
    });

    test('Based on mimetypeFromExtension()', async () => {
        const fileContents = new Blob(['test'], { type: '' });
        const testFile = new File([fileContents], 'test.jxl', {
            type: '',
        });
        expect(await mimeTypeFromFile(testFile)).toEqual('image/jxl');
    });

    test('Fallback to application/octet-stream', async () => {
        const fileContents = new Blob(['test'], { type: '' });
        const testFile = new File([fileContents], 'test.does-not-exists', {
            type: '',
        });
        expect(await mimeTypeFromFile(testFile)).toEqual('application/octet-stream');
    });
});
