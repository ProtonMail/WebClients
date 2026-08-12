import type { NodeEntity } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { formatAlbumArchiveFilename, formatDownloadArchiveFilename } from './formatDownloadArchiveFilename';

describe('formatDownloadArchiveFilename', () => {
    it('uses the node name for a single node', () => {
        const nodes: NodeEntity[] = [
            createMockNodeEntity({ uid: 'file-1', name: { ok: true as const, value: 'first.txt' } }),
        ];

        expect(formatDownloadArchiveFilename(nodes)).toBe('first.txt.zip');
    });

    it('defaults the archive name to "Proton Drive Download - <date>.zip" for multiple nodes', () => {
        const nodes: NodeEntity[] = [
            createMockNodeEntity({ uid: 'file-1', name: { ok: true as const, value: 'first.txt' } }),
            createMockNodeEntity({ uid: 'file-2', name: { ok: true as const, value: 'second.txt' } }),
        ];

        expect(formatDownloadArchiveFilename(nodes)).toMatch(/^Proton Drive Download - \d{4}-\d{2}-\d{2}\.zip$/);
    });
});

describe('formatAlbumArchiveFilename', () => {
    it('uses the trimmed album name', () => {
        expect(formatAlbumArchiveFilename('  Summer trip  ')).toBe('Summer trip.zip');
    });

    it('falls back to "Album" when the name is empty', () => {
        expect(formatAlbumArchiveFilename('   ')).toBe('Album.zip');
    });
});
