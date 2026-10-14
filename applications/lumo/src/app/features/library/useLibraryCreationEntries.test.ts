import { renderHook } from '@testing-library/react';

import type { CreationsListItem } from '../creations/hooks/useGeneratedGalleryCreations';
import { MAX_CONCURRENT_CREATION_PULLS, useLibraryCreationEntries } from './useLibraryCreationEntries';

const mockDispatch = jest.fn();
let mockState: any;

jest.mock('../../redux/hooks', () => {
    return {
        useLumoDispatch: () => mockDispatch,
        useLumoSelector: (selector: (state: any) => unknown) => selector(mockState),
    };
});

const ITEM_COUNT = MAX_CONCURRENT_CREATION_PULLS + 2;

const items: CreationsListItem[] = Array.from({ length: ITEM_COUNT }, (_, index) => {
    return {
        localId: `asset-${index}`,
        localSpaceId: 'space',
        remoteId: `remote-${index}`,
        createdAt: new Date(2026, 9, index + 1),
    };
});

const shallowAttachment = (id: string) => {
    return { id, spaceId: 'space', filename: `creation-${id}`, role: 'assistant' };
};

const pulledIds = () => {
    return mockDispatch.mock.calls.map(([action]) => {
        return action.payload.id;
    });
};

describe('useLibraryCreationEntries', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
        mockState = {
            attachments: Object.fromEntries(
                items.map((item) => {
                    return [item.localId, shallowAttachment(item.localId)];
                })
            ),
            attachmentLoadingState: {},
            conversations: { conv: { title: 'Q1 Strategy plan' } },
        };
    });

    it('starts at most the concurrent limit of downloads, then one more as each finishes', () => {
        const { rerender } = renderHook(() => {
            return useLibraryCreationEntries(items, 'all');
        });
        expect(pulledIds()).toEqual(['asset-0', 'asset-1', 'asset-2', 'asset-3']);

        // The saga marks them loading; nothing new starts while all slots are busy.
        mockState = {
            ...mockState,
            attachmentLoadingState: Object.fromEntries(
                pulledIds().map((id: string) => {
                    return [id, { loading: true }];
                })
            ),
        };
        rerender();
        expect(pulledIds()).toHaveLength(MAX_CONCURRENT_CREATION_PULLS);

        // asset-0 finishes decrypting: one slot frees up.
        mockState = {
            ...mockState,
            attachments: {
                ...mockState.attachments,
                'asset-0': {
                    ...shallowAttachment('asset-0'),
                    data: new Uint8Array([1]),
                    generatedArtifactAsset: {
                        conversationId: 'conv',
                        artifactId: 'memo',
                        artifactType: 'document',
                        artifactTitle: 'Password Manager Memo',
                    },
                },
            },
            attachmentLoadingState: { ...mockState.attachmentLoadingState, 'asset-0': { loading: false } },
        };
        rerender();
        expect(pulledIds()).toEqual(['asset-0', 'asset-1', 'asset-2', 'asset-3', 'asset-4']);
    });

    it('downloads only the creations it is asked for, and marks the rest pending', () => {
        const { result } = renderHook(() => {
            return useLibraryCreationEntries(items, new Set(['asset-0', 'asset-1']));
        });
        expect(pulledIds()).toEqual(['asset-0', 'asset-1']);
        expect(result.current[5].isPending).toBe(true);
    });

    it('keeps an entry object while nothing about it changed', () => {
        const { result, rerender } = renderHook(() => {
            return useLibraryCreationEntries(items, 'all');
        });
        const before = result.current;

        mockState = {
            ...mockState,
            attachmentLoadingState: { 'asset-5': { loading: true } },
        };
        rerender();

        expect(result.current[0]).toBe(before[0]);
    });
});
