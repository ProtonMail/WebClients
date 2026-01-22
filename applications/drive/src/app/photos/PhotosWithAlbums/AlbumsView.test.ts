import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { stableSortAlbums } from './AlbumsView';

const createMockAlbum = (linkId: string, createTime: number): DecryptedAlbum => {
    return {
        name: `Album ${linkId}`,
        createTime,
        encryptedName: 'encrypted-name',
        fileModifyTime: 123123312,
        linkId,
        parentLinkId: 'parent-1',
        type: LinkType.FOLDER,
        isFile: false,
        mimeType: '',
        hash: '',
        size: 0,
        metaDataModifyTime: createTime,
        trashed: null,
        hasThumbnail: false,
        rootShareId: 'share-1',
        volumeId: 'volume-1',
        photoCount: 0,
        permissions: {
            isOwner: true,
            isAdmin: true,
            isEditor: true,
        },
    };
};

describe('stableSortAlbums', () => {
    it('should sort albums by createTime in ascending order', () => {
        const albums: DecryptedAlbum[] = [
            createMockAlbum('album-3', 3000),
            createMockAlbum('album-1', 1000),
            createMockAlbum('album-2', 2000),
        ];

        const sorted = stableSortAlbums(albums);

        expect(sorted[0].linkId).toBe('album-1');
        expect(sorted[1].linkId).toBe('album-2');
        expect(sorted[2].linkId).toBe('album-3');
    });

    it('should use linkId as tiebreaker when createTime is equal', () => {
        const albums: DecryptedAlbum[] = [
            createMockAlbum('album-c', 1000),
            createMockAlbum('album-a', 1000),
            createMockAlbum('album-b', 1000),
        ];

        const sorted = stableSortAlbums(albums);

        expect(sorted[0].linkId).toBe('album-a');
        expect(sorted[1].linkId).toBe('album-b');
        expect(sorted[2].linkId).toBe('album-c');
    });

    it('should handle mixed scenarios with both different and equal createTimes', () => {
        const albums: DecryptedAlbum[] = [
            createMockAlbum('album-d', 2000),
            createMockAlbum('album-b', 1000),
            createMockAlbum('album-c', 2000),
            createMockAlbum('album-a', 1000),
            createMockAlbum('album-e', 3000),
        ];

        const sorted = stableSortAlbums(albums);

        expect(sorted[0].linkId).toBe('album-a'); // 1000
        expect(sorted[1].linkId).toBe('album-b'); // 1000
        expect(sorted[2].linkId).toBe('album-c'); // 2000
        expect(sorted[3].linkId).toBe('album-d'); // 2000
        expect(sorted[4].linkId).toBe('album-e'); // 3000
    });

    it('should maintain stable sort order across multiple calls', () => {
        const albums: DecryptedAlbum[] = [
            createMockAlbum('album-2', 1000),
            createMockAlbum('album-1', 1000),
            createMockAlbum('album-3', 1000),
        ];

        const sorted1 = stableSortAlbums([...albums]);
        const sorted2 = stableSortAlbums([...albums]);

        // Both sorts should produce the same order
        expect(sorted1.map((a) => a.linkId)).toEqual(sorted2.map((a) => a.linkId));
        expect(sorted1[0].linkId).toBe('album-1');
        expect(sorted1[1].linkId).toBe('album-2');
        expect(sorted1[2].linkId).toBe('album-3');
    });
});
