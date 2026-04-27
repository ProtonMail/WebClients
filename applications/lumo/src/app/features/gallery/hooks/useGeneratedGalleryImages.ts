import { useCallback, useEffect, useState } from 'react';

import { AssetType, type GeneratedAssetFromApi } from '../../../remote/api';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { addIdMapEntry } from '../../../redux/slices/core/idmap';
import { addAttachment } from '../../../redux/slices/core/attachments';
import { extraThunkArguments } from '../../../redux/thunk';

export type GalleryImageItem = {
    localId: string;
    localSpaceId: string;
    remoteId: string;
    createdAt: Date;
};

export type GallerySection = {
    label: string;
    items: GalleryImageItem[];
};

type FetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

const NOW = Date.now();
const MS_7_DAYS = 7 * 24 * 60 * 60 * 1000;
const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function groupIntoSections(items: GalleryImageItem[]): GallerySection[] {
    const cutoff7 = new Date(NOW - MS_7_DAYS);
    const cutoff30 = new Date(NOW - MS_30_DAYS);

    const last7: GalleryImageItem[] = [];
    const last30: GalleryImageItem[] = [];
    const older: GalleryImageItem[] = [];

    for (const item of items) {
        if (item.createdAt >= cutoff7) {
            last7.push(item);
        } else if (item.createdAt >= cutoff30) {
            last30.push(item);
        } else {
            older.push(item);
        }
    }

    const sections: GallerySection[] = [];
    if (last7.length > 0) sections.push({ label: 'Last 7 days', items: last7 });
    if (last30.length > 0) sections.push({ label: 'Last 30 days', items: last30 });
    if (older.length > 0) sections.push({ label: 'Older', items: older });
    return sections;
}

export function useGeneratedGalleryImages() {
    const dispatch = useLumoDispatch();
    const idmap = useLumoSelector((state) => state.idmap);
    const spaces = useLumoSelector((state) => state.spaces);
    const [sections, setSections] = useState<GallerySection[]>([]);
    const [status, setStatus] = useState<FetchStatus>('idle');
    const [hasMore, setHasMore] = useState(false);
    const [oldestTimestamp, setOldestTimestamp] = useState<number | undefined>(undefined);

    const seedAssetsIntoRedux = useCallback(
        (assets: GeneratedAssetFromApi[]) => {
            const items: GalleryImageItem[] = [];

            for (const asset of assets) {
                if (!asset.ID || !asset.AssetTag || !asset.SpaceID || !asset.CreateTime) continue;
                if (asset.DeleteTime) continue;

                const localSpaceId = idmap.remote2local.space[asset.SpaceID];
                if (!localSpaceId) {
                    console.warn(`Gallery: no local space ID for remote space ${asset.SpaceID}, skipping asset`);
                    continue;
                }

                // Skip assets whose space has been deleted — the space key is gone so
                // the attachment can never be decrypted and would spin indefinitely.
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

                dispatch(
                    addAttachment({
                        id: localId,
                        spaceId: localSpaceId,
                        uploadedAt: createdAt.toISOString(),
                        mimeType: 'image/png',
                        filename: `generated-${localId}.png`,
                    } as any)
                );

                items.push({ localId, localSpaceId, remoteId, createdAt });
            }

            return items;
        },
        [dispatch, idmap, spaces]
    );

    const fetchSection = useCallback(
        async (createTimeSince?: number, createTimeUntil?: number) => {
            const { lumoApi } = extraThunkArguments;
            if (!lumoApi) return [];

            const assets = await lumoApi.listGeneratedAssets({
                assetType: AssetType.GeneratedImage,
                createTimeSince,
                createTimeUntil,
            });

            return assets;
        },
        []
    );

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const now = Math.floor(Date.now() / 1000);
            const since30 = now - 30 * 24 * 60 * 60;

            const recentAssets = await fetchSection(since30, now);
            const items = seedAssetsIntoRedux(recentAssets);
            const grouped = groupIntoSections(items);
            setSections(grouped);

            if (items.length > 0) {
                const oldest = items.reduce(
                    (min, item) => (item.createdAt.getTime() < min ? item.createdAt.getTime() : min),
                    Infinity
                );
                setOldestTimestamp(Math.floor(oldest / 1000));
            }

            setHasMore(recentAssets.length >= 20);
            setStatus('loaded');
        } catch (error) {
            console.error('Gallery: failed to fetch generated images', error);
            setStatus('error');
        }
    }, [fetchSection, seedAssetsIntoRedux]);

    const loadMore = useCallback(async () => {
        if (!oldestTimestamp || status === 'loading') return;
        setStatus('loading');
        try {
            const olderAssets = await fetchSection(undefined, oldestTimestamp);
            const newItems = seedAssetsIntoRedux(olderAssets);

            setSections((prev) => {
                const allItems = prev.flatMap((s) => s.items).concat(newItems);
                return groupIntoSections(allItems);
            });

            if (newItems.length > 0) {
                const oldest = newItems.reduce(
                    (min, item) => (item.createdAt.getTime() < min ? item.createdAt.getTime() : min),
                    Infinity
                );
                setOldestTimestamp(Math.floor(oldest / 1000));
            }

            setHasMore(olderAssets.length >= 20);
            setStatus('loaded');
        } catch (error) {
            console.error('Gallery: failed to load more images', error);
            setStatus('error');
        }
    }, [oldestTimestamp, status, fetchSection, seedAssetsIntoRedux]);

    useEffect(() => {
        void load();
    }, []);

    return {
        sections,
        status,
        hasMore,
        loadMore,
        reload: load,
    };
}
