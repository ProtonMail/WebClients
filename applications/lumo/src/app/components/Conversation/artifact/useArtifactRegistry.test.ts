import { renderHook } from '@testing-library/react';

import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import { getArtifactVersionIndexForMessage } from './artifactRegistry';
import { CREATE_ARTIFACT_TOOL_NAME } from './createArtifactTool';
import { useArtifactRegistry } from './useArtifactRegistry';

describe('useArtifactRegistry', () => {
    it('makes a saved creation openable when its finalized message finishes loading', () => {
        const unloaded: Message = {
            id: 'saved-message',
            conversationId: 'saved-chat',
            role: Role.Assistant,
            status: 'succeeded',
            createdAt: '2026-11-06T08:00:00.000Z',
            content: '',
        };
        const loaded: Message = {
            ...unloaded,
            blocks: [
                {
                    type: 'tool_call',
                    content: '',
                    toolCall: {
                        id: 'saved-call',
                        name: CREATE_ARTIFACT_TOOL_NAME,
                        arguments: { id: 'saved-page', type: 'webpage', title: 'Saved page', content: '<h1>QA</h1>' },
                    },
                },
            ],
        };
        const { result, rerender } = renderHook(({ chain }) => useArtifactRegistry(chain), {
            initialProps: { chain: [unloaded] },
        });
        expect(getArtifactVersionIndexForMessage(result.current, 'saved-page', 'saved-message')).toBeNull();

        rerender({ chain: [loaded] });

        expect(getArtifactVersionIndexForMessage(result.current, 'saved-page', 'saved-message')).toBe(0);
        expect(result.current['saved-page'].versions[0].content).toBe('<h1>QA</h1>');
    });

    it('does not rebuild the registry for prose-only updates', () => {
        const message: Message = {
            id: 'reply',
            conversationId: 'chat',
            role: Role.Assistant,
            status: 'succeeded',
            createdAt: '2026-11-06T08:00:00.000Z',
            content: 'First prose',
        };
        const { result, rerender } = renderHook(({ chain }) => useArtifactRegistry(chain), {
            initialProps: { chain: [message] },
        });
        const registry = result.current;

        rerender({ chain: [{ ...message, content: 'Updated prose' }] });

        expect(result.current).toBe(registry);
    });
});
