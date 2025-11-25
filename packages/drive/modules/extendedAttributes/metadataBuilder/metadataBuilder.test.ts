import type { ExpandedTags } from 'exifreader';

import { buildExtendedAttributesMetadata } from './metadataBuilder';

describe('buildExtendedAttributesMetadata', () => {
    it('should build metadata from mediaInfo when no EXIF data', () => {
        const result = buildExtendedAttributesMetadata(undefined, {
            width: 1920,
            height: 1080,
            duration: 120,
        });

        expect(result).toEqual({
            Media: {
                Width: 1920,
                Height: 1080,
                Duration: 120,
            },
            Location: undefined,
            Camera: undefined,
        });
    });

    it('should extract dimensions from EXIF when available', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                ImageWidth: { value: 3840 },
                ImageLength: { value: 2160 },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Media?.Width).toBe(3840);
        expect(result.Media?.Height).toBe(2160);
    });

    it('should include GPS location when available', () => {
        const exifInfo: ExpandedTags = {
            exif: {},
            gps: {
                Latitude: 48.8566,
                Longitude: 2.3522,
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Location).toEqual({
            Latitude: 48.8566,
            Longitude: 2.3522,
        });
    });

    it('should include Camera device from EXIF', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                Model: { value: ['iPhone 12'] },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Camera?.Device).toBe('iPhone 12');
    });

    it('should include Camera orientation from EXIF', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                Orientation: { value: 6 },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Camera?.Orientation).toBe(6);
    });

    it('should include Camera capture time from EXIF', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                DateTimeOriginal: { value: ['2024:01:15 14:30:00'] },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Camera?.CaptureTime).toBeDefined();
        expect(typeof result.Camera?.CaptureTime).toBe('string');
        expect(result.Camera?.CaptureTime).toContain('2024-01-15');
    });

    it('should include SubjectCoordinates from SubjectArea', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                SubjectArea: { value: [500, 300, 200] },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Camera?.SubjectCoordinates).toEqual({
            Top: 200,
            Left: 400,
            Bottom: 400,
            Right: 600,
        });
    });

    it('should combine EXIF dimensions with mediaInfo duration', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                ImageWidth: { value: 1920 },
                ImageLength: { value: 1080 },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo, { duration: 60 });

        expect(result.Media).toEqual({
            Width: 1920,
            Height: 1080,
            Duration: 60,
        });
    });

    it('should handle PNG dimensions', () => {
        const exifInfo: ExpandedTags = {
            png: {
                'Image Width': { value: 800 },
                'Image Height': { value: 600 },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo);

        expect(result.Media?.Width).toBe(800);
        expect(result.Media?.Height).toBe(600);
    });

    it('should prefer EXIF dimensions over mediaInfo', () => {
        const exifInfo: ExpandedTags = {
            exif: {
                ImageWidth: { value: 3840 },
                ImageLength: { value: 2160 },
            },
        } as any;

        const result = buildExtendedAttributesMetadata(exifInfo, {
            width: 1920,
            height: 1080,
        });

        expect(result.Media?.Width).toBe(3840);
        expect(result.Media?.Height).toBe(2160);
    });
});
