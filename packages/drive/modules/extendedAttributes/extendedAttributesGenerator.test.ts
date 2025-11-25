import { getExifInfo } from './exifParser/exifParser';
import { generateExtendedAttributes } from './extendedAttributesGenerator';
import { buildExtendedAttributesMetadata } from './metadataBuilder/metadataBuilder';

jest.mock('./exifParser/exifParser');
jest.mock('./metadataBuilder/metadataBuilder');

describe('generateExtendedAttributes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should resolve metadata with built metadata', async () => {
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        const expectedMetadata = {
            Media: { Width: 1920, Height: 1080, Duration: 120 },
            Location: { Latitude: 48.8566, Longitude: 2.3522 },
        };
        jest.mocked(getExifInfo).mockResolvedValue(undefined);
        jest.mocked(buildExtendedAttributesMetadata).mockReturnValue(expectedMetadata);

        const { metadata } = await generateExtendedAttributes(file, 'image/jpeg');

        expect(metadata).toEqual(expectedMetadata);
    });

    it('should handle undefined mediaInfo', async () => {
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        jest.mocked(getExifInfo).mockResolvedValue(undefined);
        jest.mocked(buildExtendedAttributesMetadata).mockReturnValue({
            Media: {},
        });

        await generateExtendedAttributes(file, 'image/jpeg');

        expect(buildExtendedAttributesMetadata).toHaveBeenCalledWith(undefined, undefined);
    });
});
