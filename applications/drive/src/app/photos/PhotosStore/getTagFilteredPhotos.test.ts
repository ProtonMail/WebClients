import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import type { PhotoGridItem } from '../../store';
import { getTagFilteredPhotos } from './getTagFilteredPhotos';

jest.mock('../../store', () => ({
    isPhotoGroup: (item: unknown): item is string => typeof item === 'string',
    isDecryptedLink: () => true,
}));

describe('getTagFilteredPhotos', () => {
    const createMockPhoto = (id: string, tags: PhotoTag[] = []): PhotoGridItem =>
        ({
            linkId: id,
            photoProperties: {
                tags,
            },
        }) as PhotoGridItem;

    const createPhotoGroup = (id: string): PhotoGridItem => id as unknown as PhotoGridItem;

    it('returns all photos when PhotoTag.All is selected', () => {
        const photos = [
            createMockPhoto('1', [PhotoTag.Favorites]),
            createMockPhoto('2', [PhotoTag.Screenshots]),
            createMockPhoto('3', [PhotoTag.Videos]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.All]);

        expect(result).toEqual([photos[0], photos[1], photos[2]]);
    });

    it('filters photos based on selected tags', () => {
        const photos = [
            createMockPhoto('1', [PhotoTag.Favorites]),
            createMockPhoto('2', [PhotoTag.Screenshots]),
            createMockPhoto('3', [PhotoTag.Videos]),
            createMockPhoto('4', [PhotoTag.Favorites, PhotoTag.Portraits]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[0], photos[3]]);
    });

    it('handles multiple selected tags', () => {
        const photos = [
            createMockPhoto('1', [PhotoTag.Favorites]),
            createMockPhoto('2', [PhotoTag.Screenshots]),
            createMockPhoto('3', [PhotoTag.Videos]),
            createMockPhoto('4', [PhotoTag.Favorites, PhotoTag.Portraits]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites, PhotoTag.Videos]);

        expect(result).toEqual([photos[0], photos[2], photos[3]]);
    });

    it('keeps photo groups that are followed by a photo', () => {
        const photos = [
            createPhotoGroup('group1'),
            createMockPhoto('1', [PhotoTag.Favorites]),
            createPhotoGroup('group2'),
            createMockPhoto('2', [PhotoTag.Screenshots]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[0], photos[1]]);
    });

    it('filters out photo groups that are not followed by a photo', () => {
        const photos = [
            createPhotoGroup('group1'),
            createMockPhoto('1', [PhotoTag.Favorites]),
            createPhotoGroup('group2'),
            createMockPhoto('2', [PhotoTag.Screenshots]),
            createPhotoGroup('group3'),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[0], photos[1]]);
    });

    it('handles consecutive photo groups', () => {
        const photos = [
            createPhotoGroup('group1'),
            createPhotoGroup('group2'),
            createMockPhoto('1', [PhotoTag.Favorites]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[1], photos[2]]);
    });

    it('handles empty photos array', () => {
        const result = getTagFilteredPhotos([], [PhotoTag.Favorites]);
        expect(result).toEqual([]);
    });

    it('handles photos with no tags when specific tags are selected', () => {
        const photos = [createMockPhoto('1', []), createMockPhoto('2', [PhotoTag.Favorites])];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[1]]);
    });

    it('handles undefined photoProperties when filtering', () => {
        const photos = [{ linkId: '1' } as PhotoGridItem, createMockPhoto('2', [PhotoTag.Favorites])];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[1]]);
    });

    it('filters out photo groups if they are followed by another photo group', () => {
        const photos = [
            createPhotoGroup('group1'),
            createPhotoGroup('group2'),
            createPhotoGroup('group3'),
            createMockPhoto('1', [PhotoTag.Favorites]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([photos[2], photos[3]]);
    });

    it('filters out all photo groups if none are followed by photos after tag filtering', () => {
        const photos = [
            createPhotoGroup('group1'),
            createPhotoGroup('group2'),
            createMockPhoto('1', [PhotoTag.Screenshots]),
        ];

        const result = getTagFilteredPhotos(photos, [PhotoTag.Favorites]);

        expect(result).toEqual([]);
    });
});
