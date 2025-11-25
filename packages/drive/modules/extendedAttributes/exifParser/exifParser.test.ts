import type { ExpandedTags } from 'exifreader';

import { getExifInfo } from './exifParser';

jest.mock('exifreader', () => {
    return {
        load: jest.fn(),
    };
});

describe('getExifInfo', () => {
    let mockExifReaderLoad: jest.Mock;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        mockExifReaderLoad = require('exifreader').load;
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    it('should return undefined for non-image mime types', async () => {
        const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

        const result = await getExifInfo(file, 'application/pdf');

        expect(result).toBeUndefined();
        expect(mockExifReaderLoad).not.toHaveBeenCalled();
    });

    it('should parse EXIF data for image mime type', async () => {
        const mockExifData: ExpandedTags = {
            exif: {
                DateTimeOriginal: {
                    id: 36867,
                    value: ['2024:01:07 09:00:53'],
                    description: '2024:01:07 09:00:53',
                },
            },
        } as ExpandedTags;

        mockExifReaderLoad.mockResolvedValue(mockExifData);

        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        file.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));

        const result = await getExifInfo(file, 'image/jpeg');

        expect(result).toEqual(mockExifData);
        expect(mockExifReaderLoad).toHaveBeenCalledWith(expect.any(ArrayBuffer), { expanded: true });
    });

    it('should return undefined and warn when ExifReader throws an error', async () => {
        mockExifReaderLoad.mockImplementation(() => {
            throw new Error('Invalid EXIF data');
        });

        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        file.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));

        const result = await getExifInfo(file, 'image/jpeg');

        expect(result).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot read exif data');
    });
});
