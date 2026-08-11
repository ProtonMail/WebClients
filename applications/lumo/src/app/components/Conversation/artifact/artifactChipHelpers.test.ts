import { getArtifactChipVisualState, getArtifactLineCount, getArtifactWordCount } from './artifactChipHelpers';
import type { ArtifactRegistry } from './artifactRegistry';

const messageIdA = 'msg-a' as const;
const messageIdB = 'msg-b' as const;
const messageIdC = 'msg-c' as const;

const registry: ArtifactRegistry = {
    'my-doc': {
        id: 'my-doc',
        type: 'document',
        title: 'Latest title',
        versions: [
            { messageId: messageIdA, content: 'v1 content', createdAt: '2026-01-01' },
            { messageId: messageIdB, content: 'v2 content', createdAt: '2026-01-02' },
            { messageId: messageIdC, content: 'v3 content here', createdAt: '2026-01-03' },
        ],
    },
};

describe('artifactChipHelpers', () => {
    it('counts words in artifact content', () => {
        expect(getArtifactWordCount('one two three')).toBe(3);
        expect(getArtifactWordCount('  ')).toBe(0);
    });

    it('counts lines in artifact content', () => {
        expect(getArtifactLineCount('a\nb\nc')).toBe(3);
        expect(getArtifactLineCount('')).toBe(0);
    });

    it('returns default when the panel is closed', () => {
        expect(
            getArtifactChipVisualState({
                artifactId: 'my-doc',
                messageId: messageIdC,
                selectedId: null,
                selectedVersionIndex: 0,
                registry,
            })
        ).toBe('default');
    });

    it('returns active when this version is open in the panel', () => {
        expect(
            getArtifactChipVisualState({
                artifactId: 'my-doc',
                messageId: messageIdC,
                selectedId: 'my-doc',
                selectedVersionIndex: 2,
                registry,
            })
        ).toBe('active');
    });

    it('returns superseded when a newer version is open in the panel', () => {
        expect(
            getArtifactChipVisualState({
                artifactId: 'my-doc',
                messageId: messageIdA,
                selectedId: 'my-doc',
                selectedVersionIndex: 2,
                registry,
            })
        ).toBe('superseded');
    });
});
