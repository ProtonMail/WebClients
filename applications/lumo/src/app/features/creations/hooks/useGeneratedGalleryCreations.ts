import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsChatHistoryHydrating } from '../../../hooks/useIsChatHistoryHydrating';
import { useLumoDispatch, useLumoStore } from '../../../redux/hooks';
import { addAttachment } from '../../../redux/slices/core/attachments';
import { addIdMapEntry } from '../../../redux/slices/core/idmap';
import { extraThunkArguments } from '../../../redux/thunk';
import { AssetType, type GeneratedAssetFromApi } from '../../../remote/api';
import { getOlderPageCursor, hasOlderCreationsPage } from '../creationsPagination';

export type CreationsListItem = {
    localId: string;
    localSpaceId: string;
    remoteId: string;
    createdAt: Date;
};

type FetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface Options {
    /** Off when the Creations tab can't show (artifactsView flag): nothing is fetched or seeded. */
    enabled?: boolean;
}

export function useGeneratedGalleryCreations({ enabled = true }: Options = {}) {
    const dispatch = useLumoDispatch();
    // Read at seed time rather than subscribed to: the page must not re-render on every
    // attachment, space or id-map change.
    const store = useLumoStore();
    const isDataHydrating = useIsChatHistoryHydrating();
    const [items, setItems] = useState<CreationsListItem[]>([]);
    const [status, setStatus] = useState<FetchStatus>('idle');
    const [hasMore, setHasMore] = useState(false);
    const [oldestTimestamp, setOldestTimestamp] = useState<number | undefined>();
    const hasLoadedRef = useRef(false);

    const seedAssetsIntoRedux = useCallback(
        (assets: GeneratedAssetFromApi[]) => {
            const { idmap, spaces, attachments } = store.getState();
            const items: CreationsListItem[] = [];

            for (const asset of assets) {
                if (!asset.ID || !asset.AssetTag || !asset.SpaceID || !asset.CreateTime) {
                    continue;
                }
                if (asset.DeleteTime) {
                    continue;
                }

                const localSpaceId = idmap.remote2local.space[asset.SpaceID];
                if (!localSpaceId) {
                    continue;
                }
                if (!spaces[localSpaceId]) {
                    continue;
                }

                const localId = asset.AssetTag;
                const remoteId = asset.ID;
                const createdAt = new Date(asset.CreateTime);

                dispatch(
                    addIdMapEntry({
                        type: 'attachment',
                        localId,
                        remoteId,
                        saveToIdb: false,
                    })
                );

                if (!attachments[localId]) {
                    dispatch(
                        addAttachment({
                            id: localId,
                            spaceId: localSpaceId,
                            uploadedAt: createdAt.toISOString(),
                            mimeType: 'application/octet-stream',
                            filename: `creation-${localId}`,
                            role: 'assistant',
                        })
                    );
                }

                items.push({ localId, localSpaceId, remoteId, createdAt });
            }

            return items;
        },
        [dispatch, store]
    );

    const fetchSection = useCallback(async (createTimeSince?: number, createTimeUntil?: number) => {
        const { lumoApi } = extraThunkArguments;
        if (!lumoApi) {
            return [];
        }

        return lumoApi.listGeneratedAssets({
            assetType: AssetType.GeneratedDoc,
            createTimeSince,
            createTimeUntil,
        });
    }, []);

    /** One page older than `cursor` (seconds), seeded into Redux. */
    const fetchOlderPage = useCallback(
        async (cursor: number) => {
            const assets = await fetchSection(undefined, cursor);
            const pageItems = seedAssetsIntoRedux(assets);
            const nextCursor = getOlderPageCursor(assets, cursor);
            return { pageItems, nextCursor, hasMore: hasOlderCreationsPage(assets, nextCursor) };
        },
        [fetchSection, seedAssetsIntoRedux]
    );

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const now = Math.floor(Date.now() / 1000);
            const since30 = now - 30 * 24 * 60 * 60;

            const recentAssets = await fetchSection(since30, now);
            let loadedItems = seedAssetsIntoRedux(recentAssets);
            // Older than the first 30 days loads on demand, like the image gallery.
            let cursor: number | undefined = since30;
            let more = true;
            // With nothing recent, keep going back until something shows or the history ends, so
            // older creations are never hidden behind an empty state. Ends because the cursor
            // only ever moves back.
            while (loadedItems.length === 0 && more && cursor !== undefined) {
                const page = await fetchOlderPage(cursor);
                loadedItems = page.pageItems;
                cursor = page.nextCursor;
                more = page.hasMore;
            }
            setItems(loadedItems);
            setOldestTimestamp(cursor);
            setHasMore(more && cursor !== undefined);
            setStatus('loaded');
        } catch (error) {
            console.error('useGeneratedGalleryCreations: load failed', error);
            setStatus('error');
        }
    }, [fetchSection, fetchOlderPage, seedAssetsIntoRedux]);

    const loadMore = useCallback(async () => {
        if (oldestTimestamp === undefined || status === 'loading') {
            return;
        }
        setStatus('loading');
        try {
            const { pageItems, nextCursor, hasMore: more } = await fetchOlderPage(oldestTimestamp);
            setItems((previous) => {
                const known = new Set(
                    previous.map((item) => {
                        return item.localId;
                    })
                );
                return previous.concat(
                    pageItems.filter((item) => {
                        return !known.has(item.localId);
                    })
                );
            });
            setOldestTimestamp(nextCursor);
            setHasMore(more);
            setStatus('loaded');
        } catch (error) {
            console.error('useGeneratedGalleryCreations: load more failed', error);
            setStatus('error');
        }
    }, [oldestTimestamp, status, fetchOlderPage]);

    useEffect(() => {
        if (!enabled || isDataHydrating || hasLoadedRef.current) {
            return;
        }
        hasLoadedRef.current = true;
        void load();
    }, [enabled, isDataHydrating, load]);

    return {
        items,
        status,
        hasMore,
        loadMore,
        reload: load,
    };
}
