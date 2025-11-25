import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { getExifInfo } from './exifParser/exifParser';
import { getCaptureDateTime } from './exifParser/exifUtils';
import { buildExtendedAttributesMetadata } from './metadataBuilder/metadataBuilder';
import { generatePhotosExtendedAttributes } from './photosExtendedAttributesGenerator';
import { getPhotoTags } from './tagDetector/tagDetector';

jest.mock('./exifParser/exifParser');
jest.mock('./exifParser/exifUtils');
jest.mock('./metadataBuilder/metadataBuilder');
jest.mock('./tagDetector/tagDetector');

describe('generatePhotosExtendedAttributes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call buildExtendedAttributesMetadata with exifInfo and mediaInfo', async () => {
        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        const mockExifInfo = { exif: { DateTime: { value: ['2024:01:01 10:00:00'] } }, gps: {} } as any;
        const expectedTags = [PhotoTag.Raw, PhotoTag.Screenshots];
        const expectedMetadata = {
            Media: { Width: 1920, Height: 1080, Duration: 120 },
            Location: { Latitude: 48.8566, Longitude: 2.3522 },
        };
        const expectedCaptureTime = new Date('2024-01-15T14:30:00Z');
        jest.mocked(getExifInfo).mockResolvedValue(mockExifInfo);
        jest.mocked(buildExtendedAttributesMetadata).mockReturnValue({
            Media: { Width: 1920, Height: 1080 },
        });
        jest.mocked(getPhotoTags).mockResolvedValue(expectedTags);
        jest.mocked(getCaptureDateTime).mockReturnValue(expectedCaptureTime);
        jest.mocked(buildExtendedAttributesMetadata).mockReturnValue(expectedMetadata);

        const result = await generatePhotosExtendedAttributes(file, 'image/jpeg', {
            width: 1920,
            height: 1080,
            duration: 120,
        });

        expect(buildExtendedAttributesMetadata).toHaveBeenCalledWith(mockExifInfo, {
            width: 1920,
            height: 1080,
            duration: 120,
        });
        expect(getPhotoTags).toHaveBeenCalledWith(file, 'image/jpeg', mockExifInfo);
        expect(getCaptureDateTime).toHaveBeenCalledWith(file, mockExifInfo.exif);

        expect(result).toEqual({
            metadata: expectedMetadata,
            tags: expectedTags,
            captureTime: expectedCaptureTime,
        });
    });

    it('should handle undefined exifInfo', async () => {
        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        jest.mocked(getExifInfo).mockResolvedValue(undefined);
        jest.mocked(buildExtendedAttributesMetadata).mockReturnValue({
            Media: { Width: 1920, Height: 1080 },
        });
        jest.mocked(getPhotoTags).mockResolvedValue([]);
        jest.mocked(getCaptureDateTime).mockReturnValue(new Date('2024-01-01T00:00:00Z'));

        await generatePhotosExtendedAttributes(file, 'image/jpeg');

        expect(getCaptureDateTime).toHaveBeenCalledWith(file, undefined);
        expect(getPhotoTags).toHaveBeenCalledWith(file, 'image/jpeg', undefined);
    });

    it('should handle undefined mediaInfo', async () => {
        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        jest.mocked(getExifInfo).mockResolvedValue(undefined);
        jest.mocked(buildExtendedAttributesMetadata).mockReturnValue({
            Media: {},
        });
        jest.mocked(getPhotoTags).mockResolvedValue([]);
        jest.mocked(getCaptureDateTime).mockReturnValue(new Date('2024-01-01T00:00:00Z'));

        await generatePhotosExtendedAttributes(file, 'image/jpeg');

        expect(buildExtendedAttributesMetadata).toHaveBeenCalledWith(undefined, undefined);
    });
});
