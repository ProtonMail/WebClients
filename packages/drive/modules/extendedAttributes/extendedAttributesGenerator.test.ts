import { getExifInfo } from './exifParser/exifParser';
import { generateExtendedAttributes } from './extendedAttributesGenerator';
import { buildExtendedAttributesMetadata } from './metadataBuilder/metadataBuilder';

vi.mock('./exifParser/exifParser');
vi.mock('./metadataBuilder/metadataBuilder');

describe('generateExtendedAttributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should resolve metadata with built metadata', async () => {
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        const expectedMetadata = {
            Media: { Width: 1920, Height: 1080, Duration: 120 },
            Location: { Latitude: 48.8566, Longitude: 2.3522 },
        };
        vi.mocked(getExifInfo).mockResolvedValue(undefined);
        vi.mocked(buildExtendedAttributesMetadata).mockReturnValue(expectedMetadata);

        const { metadata } = await generateExtendedAttributes(file, 'image/jpeg');

        expect(metadata).toEqual(expectedMetadata);
    });

    it('should handle undefined mediaInfo', async () => {
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        vi.mocked(getExifInfo).mockResolvedValue(undefined);
        vi.mocked(buildExtendedAttributesMetadata).mockReturnValue({
            Media: {},
        });

        await generateExtendedAttributes(file, 'image/jpeg');

        expect(buildExtendedAttributesMetadata).toHaveBeenCalledWith(undefined, undefined);
    });
});
