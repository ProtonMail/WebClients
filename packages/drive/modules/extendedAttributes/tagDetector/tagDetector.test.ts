import type { ExpandedTags } from 'exifreader';

import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { getPhotoTags } from './tagDetector';

describe('getPhotoTags', () => {
    const createFile = (name: string, type: string): File => {
        return new File(['content'], name, { type });
    };

    it('should return RAW tag for RAW photo mime types', async () => {
        const file = createFile('photo.dng', 'image/x-adobe-dng');
        const tags = await getPhotoTags(file, 'image/x-adobe-dng');

        expect(tags).toContain(PhotoTag.Raw);
    });

    it('should return RAW tag for RAW file extensions', async () => {
        const file = createFile('photo.cr2', 'image/jpeg');
        const tags = await getPhotoTags(file, 'image/jpeg');

        expect(tags).toContain(PhotoTag.Raw);
    });

    it('should return Videos tag for video mime types', async () => {
        const file = createFile('video.mp4', 'video/mp4');
        const tags = await getPhotoTags(file, 'video/mp4');

        expect(tags).toContain(PhotoTag.Videos);
    });

    it('should return Screenshots tag from XMP metadata', async () => {
        const file = createFile('screenshot.png', 'image/png');
        const exifInfo: ExpandedTags = {
            xmp: {
                UserComment: { value: 'Screenshot' },
            },
        } as any;

        const tags = await getPhotoTags(file, 'image/png', exifInfo);

        expect(tags).toContain(PhotoTag.Screenshots);
    });

    it('should return Screenshots tag from filename', async () => {
        const file = createFile('Screenshot_20240115.png', 'image/png');
        const exifInfo: ExpandedTags = {
            xmp: {},
        } as any;

        const tags = await getPhotoTags(file, 'image/png', exifInfo);

        expect(tags).toContain(PhotoTag.Screenshots);
    });

    it('should return Panoramas tag for equirectangular projection', async () => {
        const file = createFile('panorama.jpg', 'image/jpeg');
        const exifInfo: ExpandedTags = {
            xmp: {
                ProjectionType: { value: 'equirectangular' },
            },
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toContain(PhotoTag.Panoramas);
    });

    it('should return MotionPhotos tag for motion photos', async () => {
        const file = createFile('motion.jpg', 'image/jpeg');
        const exifInfo: ExpandedTags = {
            xmp: {
                MotionPhoto: { value: '1' },
            },
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toContain(PhotoTag.MotionPhotos);
    });

    it('should return Portraits tag for Android portrait mode', async () => {
        const file = createFile('portrait.jpg', 'image/jpeg');
        const exifInfo: ExpandedTags = {
            xmp: {
                SpecialTypeID: {
                    value: 'com.google.android.apps.camera.gallery.specialtype.SpecialType-PORTRAIT',
                },
            },
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toContain(PhotoTag.Portraits);
    });

    it('should return Portraits tag for Android portrait mode in array', async () => {
        const file = createFile('portrait.jpg', 'image/jpeg');
        const exifInfo: ExpandedTags = {
            xmp: {
                SpecialTypeID: {
                    value: [{ value: 'com.google.android.apps.camera.gallery.specialtype.SpecialType-PORTRAIT' }],
                },
            },
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toContain(PhotoTag.Portraits);
    });

    it('should return Portraits tag for Apple portrait mode from MakerNote', async () => {
        const file = createFile('portrait.jpg', 'image/jpeg');
        const makerNote = new Uint8Array(100);
        makerNote[0] = 65;
        makerNote[1] = 112;
        makerNote[2] = 112;
        makerNote[3] = 108;
        makerNote[4] = 101;
        makerNote[20] = 0x00;
        makerNote[21] = 0x14;
        makerNote[28] = 0x00;
        makerNote[29] = 0x00;
        makerNote[30] = 0x00;
        makerNote[31] = 2;

        const exifInfo: ExpandedTags = {
            exif: {
                MakerNote: { value: makerNote },
            },
            xmp: {},
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toContain(PhotoTag.Portraits);
    });

    it('should return Selfies tag for Apple front camera from MakerNote', async () => {
        const file = createFile('selfie.jpg', 'image/jpeg');
        const makerNote = new Uint8Array(100);
        makerNote[0] = 65;
        makerNote[1] = 112;
        makerNote[2] = 112;
        makerNote[3] = 108;
        makerNote[4] = 101;
        makerNote[20] = 0x00;
        makerNote[21] = 0x2e;
        makerNote[28] = 0x00;
        makerNote[29] = 0x00;
        makerNote[30] = 0x00;
        makerNote[31] = 6;

        const exifInfo: ExpandedTags = {
            exif: {
                MakerNote: { value: makerNote },
            },
            xmp: {},
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toContain(PhotoTag.Selfies);
    });

    it('should return multiple tags when applicable', async () => {
        const file = createFile('screenshot_video.mp4', 'video/mp4');
        const exifInfo: ExpandedTags = {
            xmp: {
                UserComment: { value: 'Screenshot' },
            },
        } as any;

        const tags = await getPhotoTags(file, 'video/mp4', exifInfo);

        expect(tags).toContain(PhotoTag.Videos);
        expect(tags).toContain(PhotoTag.Screenshots);
        expect(tags).toHaveLength(2);
    });

    it('should return empty array when no tags apply', async () => {
        const file = createFile('photo.jpg', 'image/jpeg');
        const tags = await getPhotoTags(file, 'image/jpeg');

        expect(tags).toEqual([]);
    });

    it('should return empty array when EXIF exists but no XMP data', async () => {
        const file = createFile('photo.jpg', 'image/jpeg');
        const exifInfo: ExpandedTags = {
            exif: {},
        } as any;

        const tags = await getPhotoTags(file, 'image/jpeg', exifInfo);

        expect(tags).toEqual([]);
    });
});
