import type { ArtifactRegistry } from './artifactRegistry';
import { getConversationArtifactsForDrawer } from './conversationArtifactDrawerList';

describe('getConversationArtifactsForDrawer', () => {
    it('returns one latest non-provisional row per artifact slug', () => {
        const registry: ArtifactRegistry = {
            memo: {
                id: 'memo',
                title: 'Memo',
                type: 'document',
                versions: [
                    {
                        messageId: 'm1',
                        content: 'v1',
                        provisional: false,
                        createdAt: '2026-01-01T00:00:00.000Z',
                        source: 'prompt',
                    },
                    {
                        messageId: 'm2',
                        content: 'v2',
                        provisional: false,
                        createdAt: '2026-01-02T00:00:00.000Z',
                        source: 'prompt',
                    },
                ],
            },
            draft: {
                id: 'draft',
                title: 'Draft',
                type: 'document',
                versions: [
                    {
                        messageId: 'm3',
                        content: 'streaming',
                        provisional: true,
                        createdAt: '2026-01-03T00:00:00.000Z',
                        source: 'prompt',
                    },
                ],
            },
        };

        const rows = getConversationArtifactsForDrawer(registry);

        expect(rows).toHaveLength(1);
        expect(rows[0]?.id).toBe('memo');
        expect(rows[0]?.content).toBe('v2');
        expect(rows[0]?.latestVersionIndex).toBe(1);
    });
});
