import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive/index';
import useFlag from '@proton/unleash/useFlag';

import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getBookmark } from '../../../utils/sdk/getBookmark';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

export const useBookmarksLoader = () => {
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const { drive } = useDrive();
    const { createNotification } = useNotifications();

    const { setSharedWithMeItemInStore, setLoadingBookmarks, cleanupStaleItems } = useSharedWithMeListingStore(
        useShallow((state) => ({
            setSharedWithMeItemInStore: state.setSharedWithMeItem,
            setLoadingBookmarks: state.setLoadingBookmarks,
            cleanupStaleItems: state.cleanupStaleItems,
        }))
    );

    const loadBookmarks = useCallback(
        async (abortSignal: AbortSignal) => {
            if (useSharedWithMeListingStore.getState().isLoadingBookmarks || bookmarksFeatureDisabled) {
                return;
            }
            setLoadingBookmarks(true);
            try {
                let showErrorNotification = false;
                const loadedUids = new Set<string>();

                for await (const maybeBookmark of drive.iterateBookmarks(abortSignal)) {
                    try {
                        const { bookmark } = getBookmark(maybeBookmark);
                        loadedUids.add(bookmark.uid);
                        setSharedWithMeItemInStore({
                            name: bookmark.node.name,
                            type: bookmark.node.type,
                            mediaType: bookmark.node.mediaType,
                            itemType: ItemType.BOOKMARK,
                            thumbnailId: undefined,
                            size: undefined,
                            bookmark: {
                                uid: bookmark.uid,
                                creationTime: bookmark.creationTime,
                                url: bookmark.url,
                            },
                        });
                    } catch (e) {
                        handleSdkError(e, {
                            showNotification: false,
                        });
                        showErrorNotification = true;
                    }
                }

                if (showErrorNotification) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`We were not able to load some of your bookmarks`,
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
        },
        [
            bookmarksFeatureDisabled,
            setLoadingBookmarks,
            drive,
            setSharedWithMeItemInStore,
            createNotification,
            cleanupStaleItems,
        ]
    );

    return {
        loadBookmarks,
    };
};
