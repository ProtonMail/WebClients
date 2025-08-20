import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import { generateNodeUid, useDrive } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import { type SortField, useSortingWithDefault } from '../../hooks/util/useSorting';
import { useDefaultShare } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { type LegacyItem, mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { mapShareResultToSharingInfo, useSharingInfoStore } from '../../zustand/share/sharingInfo.store';
import { useLegacySharesByMeNodes } from './useLegacySharesByMeNode';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

export const useSharedByMeNodes = () => {
    const [isLoading, withLoading] = useLoading(true);
    const [sharedByMeNodes, setSharedByMeNodes] = useState<Record<string, LegacyItem>>({});
    const { getDefaultShare } = useDefaultShare();
    const { items: legacyNodes, isLoading: isLegacyLoading } = useLegacySharesByMeNodes();
    const { drive } = useDrive();
    const { createNotification } = useNotifications();

    const { handleError } = useSdkErrorHandler();

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(Object.values(sharedByMeNodes), DEFAULT_SORT);
    const {
        setSharingInfoStore,
        setSharingInfoStoreEmptyOrFailed,
        setSharingInfoStoreLoading,
        skipSharingInfoLoading,
    } = useSharingInfoStore(
        useShallow((state) => ({
            setSharingInfoStoreLoading: state.setLoading,
            setSharingInfoStore: state.setSharingInfo,
            setSharingInfoStoreEmptyOrFailed: state.setSharingInfoEmptyOrFailed,
            skipSharingInfoLoading: (uid: string) =>
                state.isLoading(uid) || state.isEmptyOrFailed(uid) || state.hasSharingInfo(uid),
        }))
    );
    const { loadThumbnail } = useBatchThumbnailLoader();

    const populateNodesFromLegacy = useCallback(async () => {
        const missingNodes = legacyNodes.map((node) => {
            const uid = generateNodeUid(node.volumeId, node.linkId);
            return {
                ...node,
                id: uid,
                uid,
                isLegacy: true,
                thumbnailId: node.activeRevision?.id || uid,
                parentUid: undefined,
            };
        });

        const missingNodesToAdd: Record<string, LegacyItem> = {};
        missingNodes.forEach((mappedNode) => (missingNodesToAdd[mappedNode.uid] = mappedNode));
        setSharedByMeNodes((prevSharedByMeNodes) => {
            return {
                ...prevSharedByMeNodes,
                ...missingNodesToAdd,
            };
        });
    }, [legacyNodes]);

    const loadSharedByMeNodes = useCallback(
        async (abortSignal: AbortSignal) => {
            const defaultShare = await getDefaultShare();
            let showErrorNotification = false;
            for await (const sharedByMeNode of drive.iterateSharedNodes(abortSignal)) {
                try {
                    const mappedNode = await mapNodeToLegacyItem(sharedByMeNode, defaultShare.shareId, drive);
                    setSharedByMeNodes((prevSharedByMeNodes) => {
                        return {
                            ...prevSharedByMeNodes,
                            [mappedNode.uid]: mappedNode,
                        };
                    });
                } catch (e) {
                    handleError(e, {
                        showNotification: false,
                    });
                    showErrorNotification = true;
                }
            }
            if (showErrorNotification) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`We were not able to load some of your shared items`,
                });
            }
        },
        // getDefaultShare should not be in deps params as it will cause infinite re-rendered
        [drive, handleError, createNotification]
    );

    const handleSharingInfoLoading = useCallback(
        async (item: LegacyItem) => {
            if (skipSharingInfoLoading(item.uid)) {
                return;
            }

            try {
                setSharingInfoStoreLoading(item.uid);
                const shareResult = await drive.getSharingInfo(item.uid);
                const sharingInfo = mapShareResultToSharingInfo(shareResult);
                setSharingInfoStore(item.uid, sharingInfo);
            } catch (error) {
                setSharingInfoStoreEmptyOrFailed(item.uid);
                handleError(error, {
                    fallbackMessage: c('Error').t`We were not able to load some of your shared items details`,
                });
            }
        },
        [
            skipSharingInfoLoading,
            drive,
            setSharingInfoStore,
            setSharingInfoStoreLoading,
            setSharingInfoStoreEmptyOrFailed,
            handleError,
        ]
    );

    const handleRenderItem = useCallback(
        (uid: string) => {
            const renderedItem = sharedByMeNodes[uid];
            if (renderedItem) {
                loadThumbnail({
                    uid: renderedItem.uid,
                    thumbnailId: renderedItem.thumbnailId,
                    hasThumbnail: renderedItem.hasThumbnail,
                    cachedThumbnailUrl: renderedItem.cachedThumbnailUrl,
                });
                void handleSharingInfoLoading(renderedItem).catch(handleError);
            }
        },
        [sharedByMeNodes, loadThumbnail, handleSharingInfoLoading, handleError]
    );

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(loadSharedByMeNodes(abortController.signal)).catch((e) =>
            handleError(e, { fallbackMessage: c('Error').t`We were not able to load some of your shared items` })
        );
        return () => {
            abortController.abort();
        };
    }, [loadSharedByMeNodes, withLoading, handleError]);

    useEffect(() => {
        void populateNodesFromLegacy().catch((e) =>
            handleError(e, { fallbackMessage: c('Error').t`We were not able to load some of your shared items` })
        );
    }, [populateNodesFromLegacy, handleError]);

    return {
        isLoading: isLoading || isLegacyLoading,
        sharedByMeNodes: sortedList,
        sortParams,
        setSorting,
        onRenderItem: handleRenderItem,
    };
};
