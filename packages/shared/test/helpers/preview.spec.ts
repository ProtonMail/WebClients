import { SupportedMimeTypes } from '../../lib/drive/constants';
import { MAX_PREVIEW_FILE_SIZE, MAX_PREVIEW_TEXT_SIZE, isPreviewAvailable } from '../../lib/helpers/preview';

describe('isPreviewAvailable()', () => {
    const textTypes = ['text/any', 'application/json'];
    const supportedTypes = [SupportedMimeTypes.jpg, 'video/any', 'audio/any', ...textTypes];
    const unsupportedTypes = ['image/any', 'application/any', 'any'];

    supportedTypes.forEach((type) => {
        describe(`for supported type ${type}`, () => {
            it('should return positive answer without size', () => {
                expect(isPreviewAvailable(type)).toBe(true);
            });

            const size = textTypes.includes(type) ? MAX_PREVIEW_TEXT_SIZE : MAX_PREVIEW_FILE_SIZE;
            it('should return positive answer with reasonable size', () => {
                expect(isPreviewAvailable(type, size / 2)).toBe(true);
            });

            it('should return negative answer with too big size', () => {
                expect(isPreviewAvailable(type, size + 1)).toBe(false);
            });
        });
    });

    unsupportedTypes.forEach((type) => {
        it(`should return negative answer for unsupported ${type} without size`, () => {
            expect(isPreviewAvailable(type)).toBe(false);
        });
    });
});
