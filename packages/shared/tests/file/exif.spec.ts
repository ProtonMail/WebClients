import removeExifMetadata from '../../lib/helpers/exif';
// Image with exif data
import image from './exif.jpg';

describe('removeExifMetadata', () => {
    let originalFile: File;

    beforeEach(async () => {
        const response = await fetch(image);
        const blob = await response.blob();
        originalFile = new File([blob], 'test.jpg', { type: 'image/jpeg' });
    });

    it('should return a File object with the same name and type', async () => {
        const result = await removeExifMetadata(originalFile);

        expect(result).toBeInstanceOf(File);
        expect(result.name).toBe(originalFile.name);
        expect(result.type).toBe(originalFile.type);
    });

    it('should not modify the file for unsupported types', async () => {
        const unsupportedFile = new File([new Blob(['test'])], 'test.txt', { type: 'text/plain' });
        const result = await removeExifMetadata(unsupportedFile);

        expect(result).toBe(unsupportedFile);
    });

    it('should remove exif data from the image', async () => {
        const result = await removeExifMetadata(originalFile);

        expect(result).toBeInstanceOf(File);
        const originalSize = originalFile.size;
        const newSize = result.size;

        expect(newSize).toBeLessThan(originalSize);
    });
});
