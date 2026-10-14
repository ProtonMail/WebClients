import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsChatHistoryHydrating } from '../../../hooks/useIsChatHistoryHydrating';
import { useLumoDispatch, useLumoStore } from '../../../redux/hooks';
import { addAttachment } from '../../../redux/slices/core/attachments';
import { addIdMapEntry } from '../../../redux/slices/core/idmap';
import { extraThunkArguments } from '../../../redux/thunk';
import { AssetType, type GeneratedAssetFromApi } from '../../../remote/api';
import { CREATIONS_LIST_PAGE_SIZE, getNextCreationsListUntil } from '../creationsPagination';

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
    const hasLoadedRef = useRef(false);
    const isMountedRef = useRef(true);
    const seenAssetIdsRef = useRef(new Set<string>());
    // Where the list walk continues (CreateTimeUntil); undefined once the list is complete.
    const nextUntilRef = useRef<number | undefined>(undefined);

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

    /**
     * Walks the list back from `startUntil` (see getNextCreationsListUntil), adding each page as it
     * lands. A failed page keeps everything already listed and leaves the cursor where it stopped,
     * so `retry` resumes from there.
     */
    const walk = useCallback(
        async (startUntil: number) => {
            const { lumoApi } = extraThunkArguments;
            if (!lumoApi) {
                return;
            }
            setStatus('loading');
            let until: number | undefined = startUntil;
            try {
                while (until !== undefined) {
                    const page = await lumoApi.listGeneratedAssets({
                        assetType: AssetType.GeneratedDoc,
                        pageSize: CREATIONS_LIST_PAGE_SIZE,
                        // Explicit, or the server only looks at the 365 days before `until`.
                        createTimeSince: 0,
                        createTimeUntil: until,
                    });
                    if (!isMountedRef.current) {
                        return;
                    }
                    // Windows overlap by a second (bounds are inclusive), so pages can repeat assets.
                    const seen = seenAssetIdsRef.current;
                    const unseen = page.filter((asset) => {
                        return !seen.has(asset.ID);
                    });
                    for (const asset of unseen) {
                        seen.add(asset.ID);
                    }
                    const pageItems = seedAssetsIntoRedux(unseen);
                    if (pageItems.length > 0) {
                        setItems((previous) => {
                            return previous.concat(pageItems);
                        });
                    }
                    until = getNextCreationsListUntil(page, until);
                    nextUntilRef.current = until;
                }
                setStatus('loaded');
            } catch (error) {
                console.error('useGeneratedGalleryCreations: list failed', error);
                if (isMountedRef.current) {
                    setStatus('error');
                }
            }
        },
        [seedAssetsIntoRedux]
    );

    const retry = useCallback(() => {
        const until = nextUntilRef.current;
        if (until !== undefined) {
            void walk(until);
        }
    }, [walk]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!enabled || isDataHydrating || hasLoadedRef.current) {
            return;
        }
        hasLoadedRef.current = true;
        const now = Math.floor(Date.now() / 1000);
        nextUntilRef.current = now;
        void walk(now);
    }, [enabled, isDataHydrating, walk]);

    return {
        /** Newest first, as the list API returns them. */
        items,
        status,
        retry,
    };
}
