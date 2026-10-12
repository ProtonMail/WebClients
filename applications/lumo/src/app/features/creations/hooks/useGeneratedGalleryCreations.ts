import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsChatHistoryHydrating } from '../../../hooks/useIsChatHistoryHydrating';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { addAttachment } from '../../../redux/slices/core/attachments';
import { addIdMapEntry } from '../../../redux/slices/core/idmap';
import { extraThunkArguments } from '../../../redux/thunk';
import { AssetType, type GeneratedAssetFromApi } from '../../../remote/api';
import {
    type CreationsListItem,
    type CreationsListSection,
    groupCreationsIntoSections,
} from '../groupCreationsSections';

export type CreationsGallerySection = CreationsListSection;

type FetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

export function useGeneratedGalleryCreations() {
    const dispatch = useLumoDispatch();
    const isDataHydrating = useIsChatHistoryHydrating();
    const idmap = useLumoSelector((state) => state.idmap);
    const spaces = useLumoSelector((state) => state.spaces);
    const attachments = useLumoSelector((state) => state.attachments);
    const [sections, setSections] = useState<CreationsGallerySection[]>([]);
    const [status, setStatus] = useState<FetchStatus>('idle');
    const hasLoadedRef = useRef(false);

    const seedAssetsIntoRedux = useCallback(
        (assets: GeneratedAssetFromApi[]) => {
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
                            mimeType: 'text/markdown',
                            filename: `creation-${localId}.md`,
                            role: 'assistant',
                        })
                    );
                }

                items.push({ localId, localSpaceId, remoteId, createdAt });
            }

            return items;
        },
        [attachments, dispatch, idmap, spaces]
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

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const now = Math.floor(Date.now() / 1000);
            const since30 = now - 30 * 24 * 60 * 60;

            const recentAssets = await fetchSection(since30, now);
            const items = seedAssetsIntoRedux(recentAssets);
            setSections(groupCreationsIntoSections(items));
            setStatus('loaded');
        } catch (error) {
            console.error('useGeneratedGalleryCreations: load failed', error);
            setStatus('error');
        }
    }, [fetchSection, seedAssetsIntoRedux]);

    useEffect(() => {
        if (isDataHydrating || hasLoadedRef.current) {
            return;
        }
        hasLoadedRef.current = true;
        void load();
    }, [isDataHydrating, load]);

    return {
        sections,
        status,
        reload: load,
    };
}
