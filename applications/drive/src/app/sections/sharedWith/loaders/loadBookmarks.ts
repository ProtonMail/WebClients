import { c } from 'ttag';

import { getDrive } from '@proton/drive/index';

import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getBookmark } from '../../../utils/sdk/getBookmark';
import { defaultSharedOnCellConfig } from '../driveExplorerCells/SharedOnCell';
import { ItemType, useSharedWithMeStore } from '../useSharedWithMe.store';

export const loadBookmarks = async (abortSignal: AbortSignal) => {
    const {
        isLoadingBookmarks,
        setLoadingBookmarks,
        setSharedWithMeItem,
        cleanupStaleItems,
        setSorting,
        sortField,
        direction,
    } = useSharedWithMeStore.getState();
    if (isLoadingBookmarks) {
        return;
    }
    setLoadingBookmarks(true);
    try {
        const loadedUids = new Set<string>();

        for await (const maybeBookmark of getDrive().iterateBookmarks(abortSignal)) {
            const { bookmark } = getBookmark(maybeBookmark);
            loadedUids.add(bookmark.uid);
            setSharedWithMeItem({
                name: bookmark.node.name,
                type: bookmark.node.type,
                mediaType: bookmark.node.mediaType,
                itemType: ItemType.BOOKMARK,
                activeRevisionUid: undefined,
                size: undefined,
                bookmark: {
                    uid: bookmark.uid,
                    creationTime: bookmark.creationTime,
                    url: bookmark.url,
                },
            });
        }

        if (defaultSharedOnCellConfig.sortConfig) {
            setSorting({
                sortField,
                direction,
                sortConfig: defaultSharedOnCellConfig.sortConfig,
            });
        }

        cleanupStaleItems(ItemType.BOOKMARK, loadedUids);
    } catch (e) {
        handleSdkError(e, {
            fallbackMessage: c('Error').t`We were not able to load some of your saved shared links`,
        });
    } finally {
        setLoadingBookmarks(false);
    }
};
