import { useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, getDrive, getDriveForPhotos, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { type BrowserItemId, useSelection } from '../../../components/FileBrowser';
import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import type { SortField } from '../../../hooks/util/useSorting';
import { useSortingWithDefault } from '../../../hooks/util/useSorting';
import { useDrivePreviewModal } from '../../../modals/preview';
import { useUserSettings } from '../../../store';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { useSharingInfoStore } from '../../../zustand/share/sharingInfo.store';
import type { MappedLegacyItem } from '../SharedByMeCells';
import { useSharedByMeStore } from '../useSharedByMe.store';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

const getSelectedItemsId = (items: { id: string }[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => items.find((item) => selectedItemId === item.id)).filter(isTruthy);

export const useSharedByMeItemsWithSelection = () => {
    const { layout } = useUserSettings();
    const { navigateToAlbum, navigateToLink } = useDriveNavigation();
    // TODO: We should refactor the useBatchThumbnailLoader to support passing instance per item
    const { loadThumbnail } = useBatchThumbnailLoader({ drive: getDrive() });
    const { loadThumbnail: loadPhotosThumbnail } = useBatchThumbnailLoader({ drive: getDriveForPhotos() });
    const selectionControls = useSelection();
    const { sharedByMeItems, isLoading, getSharedByMeItem, hasEverLoaded } = useSharedByMeStore(
        useShallow((state) => ({
            getSharedByMeItem: state.getSharedByMeItem,
            sharedByMeItems: state.getAllSharedByMeItems(),
            isLoading: state.isLoading(),
            hasEverLoaded: state.hasEverLoaded,
        }))
    );

    const { skipSharingInfoLoading } = useSharingInfoStore(
        useShallow((state) => ({
            skipSharingInfoLoading: (uid: string) =>
                state.isLoading(uid) || state.isEmptyOrFailed(uid) || state.hasSharingInfo(uid),
        }))
    );

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    // TODO: Cleanup mappedItems as we probably don't need all of this
    const mappedItems = useMemo((): MappedLegacyItem[] => {
        return sharedByMeItems.map((item) => {
            const { volumeId, nodeId } = splitNodeUid(item.nodeUid);
            return {
                id: item.nodeUid,
                uid: item.nodeUid,
                trashed: null,
                volumeId,
                parentLinkId: item.parentUid ? splitNodeUid(item.parentUid).nodeId : '',
                rootShareId: item.rootShareId,
                mimeType: item.mediaType || '',
                linkId: nodeId,
                isFile: item.type === 'file',
                name: item.name,
                size: item.size || 0,
                thumbnailId: item.thumbnailId,
                metaDataModifyTime: item.creationTime ? item.creationTime.getTime() : 0,
                fileModifyTime: item.creationTime ? item.creationTime.getTime() : 0,
                shareUrl: item.publicLink
                    ? {
                          id: '',
                          token: '',
                          isExpired: false,
                          createTime: item.creationTime ? item.creationTime.getTime() : 0,
                          expireTime: item.publicLink.expirationTime ? item.publicLink.expirationTime.getTime() : null,
                          numAccesses: item.publicLink.numberOfInitializedDownloads || 0,
                      }
                    : undefined,
                sharedOn: item.creationTime ? item.creationTime.getTime() : undefined,
                sharedBy: undefined,
                signatureEmail: undefined,
            };
        });
    }, [sharedByMeItems]);

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(mappedItems, DEFAULT_SORT);
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, !hasEverLoaded);

    const isEmpty = hasEverLoaded && !isLoading && mappedItems.length === 0;

    const handleOpenItem = useCallback(
        async (uid: BrowserItemId) => {
            const storeItem = getSharedByMeItem(uid);
            if (!storeItem) {
                return;
            }

            document.getSelection()?.removeAllRanges();

            const { nodeId } = splitNodeUid(storeItem.nodeUid);
            if (storeItem.mediaType && isNativeProtonDocsAppFile(storeItem.mediaType)) {
                const openInDocsInfo = getOpenInDocsInfo(storeItem.mediaType);
                if (openInDocsInfo) {
                    return openDocsOrSheetsDocument({
                        uid: storeItem.nodeUid,
                        isNative: openInDocsInfo.isNative,
                        type: openInDocsInfo.type,
                        openBehavior: 'tab',
                    });
                }
            }

            if (storeItem.mediaType === 'Album') {
                navigateToAlbum(storeItem.rootShareId, nodeId);
                return;
            }

            if (storeItem.type === NodeType.File && isSDKPreviewEnabled) {
                showPreviewModal({
                    drive: getDrivePerNodeType(storeItem.type),
                    deprecatedContextShareId: storeItem.rootShareId,
                    nodeUid: storeItem.nodeUid,
                });
                return;
            }

            navigateToLink(
                storeItem.rootShareId,
                nodeId,
                storeItem.type === NodeType.File || storeItem.type === NodeType.Photo
            );
        },
        [getSharedByMeItem, navigateToAlbum, navigateToLink, isSDKPreviewEnabled, showPreviewModal]
    );

    const handleRenderItem = useCallback(
        ({ id }: { id: string }) => {
            const storeItem = getSharedByMeItem(id);
            if (!storeItem) {
                return;
            }

            incrementItemRenderedCounter();

            if (storeItem.type === NodeType.Photo) {
                loadPhotosThumbnail({
                    uid: storeItem.nodeUid,
                    thumbnailId: storeItem.thumbnailId || storeItem.nodeUid,
                    hasThumbnail: !!storeItem.thumbnailId,
                    cachedThumbnailUrl: undefined,
                });
            } else {
                loadThumbnail({
                    uid: storeItem.nodeUid,
                    thumbnailId: storeItem.thumbnailId || storeItem.nodeUid,
                    hasThumbnail: !!storeItem.thumbnailId,
                    cachedThumbnailUrl: undefined,
                });
            }

            // Load sharing info if needed
            if (!skipSharingInfoLoading(storeItem.nodeUid)) {
                // This would need to be implemented when the sharing info loading is available
                // Similar to what's done in the original useSharedByMeNodes
            }
        },
        [getSharedByMeItem, incrementItemRenderedCounter, loadThumbnail, skipSharingInfoLoading]
    );

    const handleSorting = useCallback(
        async (sortParams: { sortField: SortField; sortOrder: SORT_DIRECTION }) => {
            void setSorting(sortParams);
        },
        [setSorting]
    );

    const selectedItemIds = selectionControls?.selectedItemIds || [];
    const selectedItemsIds = getSelectedItemsId(mappedItems, selectedItemIds);
    const selectedItems = useMemo(
        () => selectedItemsIds.map(({ id }) => getSharedByMeItem(id)).filter(isTruthy),
        [selectedItemsIds, getSharedByMeItem]
    );

    return {
        items: sortedList,
        selectedItems,
        isLoading,
        layout,
        sortParams,
        handleOpenItem,
        handleRenderItem,
        handleSorting,
        isEmpty,
        previewModal,
    };
};
