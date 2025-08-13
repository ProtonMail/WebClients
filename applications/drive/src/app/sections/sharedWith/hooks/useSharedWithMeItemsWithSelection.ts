import { useCallback, useEffect, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../../components/FileBrowser';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import { useBookmarksActions } from '../../../hooks/drive/useBookmarksActions';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { type SortField, type SortParams, useSortingWithDefault } from '../../../hooks/util/useSorting';
import { useDocumentActions, useUserSettings } from '../../../store';
import { useDriveDocsFeatureFlag } from '../../../store/_documents';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';
import { ItemType, getKeyUid, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

const DEFAULT_SORT = {
    sortField: 'sharedOn' as SortField,
    sortOrder: SORT_DIRECTION.DESC,
};

const getSelectedItemsId = (items: { id: string }[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => items.find((item) => selectedItemId === item.id)).filter(isTruthy);

/**
 * This hook is meant to be deleted.
 * It was created to unload the main SharedWithMe component from business complexity
 * What we want to achieve is to have stuff done differently in FileBrowser
 * For the thumbnail loading, it will be directly connected to it instead of passing this handleRenderItem calback
 * We want also to remove the mapping on legacy type, which will be removed with the FileBrowser refactor
 */
export const useSharedWithMeItemsWithSelection = () => {
    const { navigateToLink, navigateToAlbum } = useDriveNavigation();
    const selectionControls = useSelection();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { openBookmark } = useBookmarksActions();
    const { layout } = useUserSettings();
    const { loadThumbnail } = useBatchThumbnailLoader();

    const {
        getSharedWithMeStoreItem,
        invitationPositionedItems,
        regularItems,
        clearItemsWithInvitationPosition,
        isLoading,
    } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getSharedWithMeStoreItem: state.getSharedWithMeItem,
            invitationPositionedItems: state.getInvitationPositionedItems(),
            regularItems: state.getRegularItems(),
            clearItemsWithInvitationPosition: state.clearItemsWithInvitationPosition,
            isLoading: state.isLoading(),
        }))
    );

    // Clear on components mount, first listing of items
    useEffect(() => {
        clearItemsWithInvitationPosition();
    }, [clearItemsWithInvitationPosition]);

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, isLoading);

    // Do not add logic here, it will be removed later
    const handleRenderItem = useCallback(
        (uid: string) => {
            incrementItemRenderedCounter();
            const renderedItem = getSharedWithMeStoreItem(uid);
            if (renderedItem?.thumbnailId && renderedItem.itemType !== ItemType.BOOKMARK) {
                loadThumbnail({
                    uid: renderedItem.nodeUid,
                    thumbnailId: renderedItem.thumbnailId,
                    hasThumbnail: true,
                    cachedThumbnailUrl: '',
                });
            }
        },
        [getSharedWithMeStoreItem, incrementItemRenderedCounter, loadThumbnail]
    );

    // Map regular items for sorting
    const regularItemsToSort = regularItems.map((item) => ({
        uid: getKeyUid(item),
        isFile: item.type === NodeType.File,
        name: item.name,
        mimeType: item.mediaType || '',
        size: 0,
        metaDataModifyTime: 0,
        fileModifyTime: 0,
        trashed: null,
        sharedOn:
            (item.itemType === ItemType.BOOKMARK && dateToLegacyTimestamp(item.bookmark.creationTime)) ||
            (item.itemType === ItemType.DIRECT_SHARE && dateToLegacyTimestamp(item.directShare.sharedOn)) ||
            undefined,
        sharedBy: (item.itemType === ItemType.DIRECT_SHARE && item.directShare.sharedBy) || '',
    }));

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(regularItemsToSort, DEFAULT_SORT);

    const items = useMemo(() => [...invitationPositionedItems, ...sortedList], [invitationPositionedItems, sortedList]);

    const handleSorting = useCallback(
        (sortParamsInput: SortParams<SortField>) => {
            void setSorting(sortParamsInput);
            clearItemsWithInvitationPosition();
        },
        [clearItemsWithInvitationPosition, setSorting]
    );

    const getMapLegacyItems = useCallback(() => {
        const mappedItems = [];
        for (const item of items) {
            const keyUid = 'uid' in item ? item.uid : getKeyUid(item);
            const storeItem = getSharedWithMeStoreItem(keyUid);
            if (storeItem) {
                mappedItems.push({
                    id: keyUid,
                    trashed: null,
                    volumeId: storeItem.legacy.volumeId,
                    parentLinkId: '',
                    rootShareId: storeItem.legacy.shareId,
                    mimeType: storeItem.mediaType || '',
                    linkId: storeItem.legacy.linkId,
                    isFile: storeItem.type === NodeType.File,
                    name: storeItem.name,
                    size: storeItem.size || 0,
                });
            }
        }
        return mappedItems;
    }, [items, getSharedWithMeStoreItem]);

    const mapLegacyItems = useMemo(() => getMapLegacyItems(), [getMapLegacyItems]);

    const selectedItemIds = selectionControls?.selectedItemIds || [];
    const selectedItemsIds = getSelectedItemsId(mapLegacyItems, selectedItemIds);
    const selectedItems = useMemo(
        () => selectedItemsIds.map(({ id }) => getSharedWithMeStoreItem(id)).filter(isTruthy),
        [selectedItemsIds, getSharedWithMeStoreItem]
    );

    const handleOpenItem = useCallback(
        (uid: string) => {
            const item = getSharedWithMeStoreItem(uid);
            if (!item) {
                return;
            }
            if (item.itemType === ItemType.BOOKMARK) {
                void openBookmark(item.bookmark.url);
                return;
            }
            document.getSelection()?.removeAllRanges();

            if (item.mediaType && isProtonDocsDocument(item.mediaType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'doc',
                        linkId: item.legacy.linkId,
                        shareId: item.legacy.shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            } else if (item.mediaType && isProtonDocsSpreadsheet(item.mediaType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'sheet',
                        linkId: item.legacy.linkId,
                        shareId: item.legacy.shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            }

            if (item.type === NodeType.Album) {
                navigateToAlbum(item.legacy.shareId, item.legacy.linkId);
                return;
            }
            navigateToLink(item.legacy.shareId, item.legacy.linkId, item.type === NodeType.File);
        },
        [navigateToLink, openBookmark, isDocsEnabled, openDocument, navigateToAlbum, getSharedWithMeStoreItem]
    );

    return {
        items: mapLegacyItems,
        selectedItems,
        isLoading,
        layout,
        sortParams,
        handleOpenItem,
        handleRenderItem,
        handleSorting,
        selectionControls,
        isEmpty: !mapLegacyItems.length && !isLoading,
    };
};
