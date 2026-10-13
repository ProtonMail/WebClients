import { useEffect, useMemo, useRef } from 'react';

import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { pullAttachmentRequest } from '../../redux/slices/core/attachments';
import type { LumoState } from '../../redux/store';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import { getCreationDisplayTitle } from '../creations/creationDisplayTitle';
import type { CreationsListItem } from '../creations/hooks/useGeneratedGalleryCreations';
import type { LibraryCreationEntry } from './libraryCreations';

/**
 * How many assets download and decrypt at once. A judgement call: enough that a page of cards fills
 * in quickly, few enough that a long library doesn't fire every request at the same moment.
 */
export const MAX_CONCURRENT_CREATION_PULLS = 4;

type PullStatus = 'pending' | 'loading' | 'error' | 'ready';

interface CreationSummary {
    localId: string;
    spaceId?: string;
    status: PullStatus;
    title: string;
    artifactType?: ArtifactType;
    conversationTitle?: string;
}

const summarize = (state: LumoState, item: CreationsListItem): CreationSummary => {
    const attachment = state.attachments[item.localId];
    const loadingState = state.attachmentLoadingState[item.localId];
    const meta = attachment?.generatedArtifactAsset;
    const hasData = Boolean(attachment?.data || attachmentDataCache.getData(item.localId));
    let status: PullStatus = 'pending';
    // Ready once the bytes are here, even without artifact meta, so an odd asset can't sit
    // "pending" forever and keep re-taking a download slot.
    if (hasData) {
        status = 'ready';
    } else if (loadingState?.loading) {
        status = 'loading';
    } else if (loadingState?.error) {
        status = 'error';
    }
    return {
        localId: item.localId,
        spaceId: attachment?.spaceId,
        status,
        title: getCreationDisplayTitle(attachment?.filename, meta, status === 'pending' || status === 'loading'),
        artifactType: meta?.artifactType,
        conversationTitle: meta ? state.conversations[meta.conversationId]?.title : undefined,
    };
};

const isSameSummary = (a: CreationSummary, b: CreationSummary): boolean => {
    return (
        a.localId === b.localId &&
        a.spaceId === b.spaceId &&
        a.status === b.status &&
        a.title === b.title &&
        a.artifactType === b.artifactType &&
        a.conversationTitle === b.conversationTitle
    );
};

const areSameSummaries = (a: CreationSummary[], b: CreationSummary[]): boolean => {
    return (
        a.length === b.length &&
        a.every((summary, index) => {
            return isSameSummary(summary, b[index]);
        })
    );
};

/**
 * Pairs each listed creation with what its decrypted asset says (title, type, chat). Every asset is
 * pulled, not only the visible cards, because search and the type filters need them all, but at
 * most MAX_CONCURRENT_CREATION_PULLS at a time.
 *
 * Subscribes to a per-item summary rather than whole store slices, and reuses an entry object
 * while its summary is unchanged, so one asset finishing re-renders one card, not the grid.
 */
export function useLibraryCreationEntries(items: CreationsListItem[]): LibraryCreationEntry[] {
    const dispatch = useLumoDispatch();
    const summaries = useLumoSelector((state: LumoState) => {
        return items.map((item) => {
            return summarize(state, item);
        });
    }, areSameSummaries);
    // Asked for but not yet marked loading in the store; counted as in flight.
    const requestedRef = useRef(new Set<string>());
    const entryCacheRef = useRef(new Map<string, { summary: CreationSummary; entry: LibraryCreationEntry }>());

    useEffect(() => {
        const requested = requestedRef.current;
        for (const summary of summaries) {
            if (summary.status !== 'pending') {
                requested.delete(summary.localId);
            }
        }
        const loadingCount = summaries.filter((summary) => {
            return summary.status === 'loading';
        }).length;
        let freeSlots = MAX_CONCURRENT_CREATION_PULLS - loadingCount - requested.size;
        for (const summary of summaries) {
            if (freeSlots <= 0) {
                break;
            }
            if (summary.status !== 'pending' || !summary.spaceId || requested.has(summary.localId)) {
                continue;
            }
            requested.add(summary.localId);
            freeSlots -= 1;
            dispatch(pullAttachmentRequest({ id: summary.localId, spaceId: summary.spaceId }));
        }
    }, [summaries, dispatch]);

    return useMemo(() => {
        const cache = entryCacheRef.current;
        return items.map((item, index) => {
            const summary = summaries[index];
            const cached = cache.get(item.localId);
            if (cached && cached.entry.item === item && isSameSummary(cached.summary, summary)) {
                return cached.entry;
            }
            const entry: LibraryCreationEntry = {
                item,
                title: summary.title,
                artifactType: summary.artifactType,
                conversationTitle: summary.conversationTitle,
            };
            cache.set(item.localId, { summary, entry });
            return entry;
        });
    }, [items, summaries]);
}
