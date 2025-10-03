import { useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { splitNodeUid } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { type BrowserItemId, useSelection } from '../../../components/FileBrowser';
import { useDocumentActions } from '../../../hooks/docs/useDocumentActions';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import type { SortField } from '../../../hooks/util/useSorting';
import { useSortingWithDefault } from '../../../hooks/util/useSorting';
import { useUserSettings } from '../../../store';
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
    const { openDocument } = useDocumentActions();
    const { navigateToAlbum, navigateToLink } = useDriveNavigation();
    const { loadThumbnail } = useBatchThumbnailLoader();
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
        (uid: BrowserItemId) => {
            const storeItem = getSharedByMeItem(uid);
            if (!storeItem) {
                return;
            }

            document.getSelection()?.removeAllRanges();

            const { nodeId } = splitNodeUid(storeItem.nodeUid);
            if (storeItem.mediaType && isProtonDocsDocument(storeItem.mediaType)) {
                return openDocument({
                    type: 'doc',
                    uid: nodeId,
                    openBehavior: 'tab',
                });
            }

            if (storeItem.mediaType && isProtonDocsSpreadsheet(storeItem.mediaType)) {
                return openDocument({
                    type: 'sheet',
                    uid: nodeId,
                    openBehavior: 'tab',
                });
            }

            if (storeItem.mediaType === 'Album') {
                navigateToAlbum(storeItem.rootShareId, nodeId);
                return;
            }

            navigateToLink(storeItem.rootShareId, nodeId, storeItem.type === 'file');
        },
        [getSharedByMeItem, openDocument, navigateToAlbum, navigateToLink]
    );

    const handleRenderItem = useCallback(
        ({ id }: { id: string }) => {
            const storeItem = getSharedByMeItem(id);
            if (!storeItem) {
                return;
            }

            incrementItemRenderedCounter();

            loadThumbnail({
                uid: storeItem.nodeUid,
                thumbnailId: storeItem.thumbnailId || storeItem.nodeUid,
                hasThumbnail: !!storeItem.thumbnailId,
                cachedThumbnailUrl: undefined,
            });

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
    };
};
