import type { useConfirmActionModal } from '@proton/components';

import { type BookmarkItem } from '../../../zustand/sections/sharedWithMeListing.store';
import { OpenBookmarkButton } from '../buttons/OpenBookmarkButton';
import { RemoveBookmarkButton } from '../buttons/RemoveBookmarkButton';
import { createItemChecker } from './actionsItemsChecker';

interface BaseBookmarkActionsProps {
    selectedBookmarks: BookmarkItem[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ContextMenuBookmarkActionsProps extends BaseBookmarkActionsProps {
    type: 'contextMenu';
    close: () => void;
}

interface ToolbarBookmarkActionsProps extends BaseBookmarkActionsProps {
    type: 'toolbar';
    close?: never;
}

type BookmarkActionsProps = ContextMenuBookmarkActionsProps | ToolbarBookmarkActionsProps;

export const BookmarkActions = ({ selectedBookmarks, showConfirmModal, close, type }: BookmarkActionsProps) => {
    const itemChecker = createItemChecker(selectedBookmarks);
    const singleItem = selectedBookmarks.at(0);

    if (itemChecker.isOnlyOneItem && singleItem) {
        return (
            <>
                <OpenBookmarkButton
                    url={singleItem.bookmark.url}
                    {...(type === 'contextMenu' ? { close, type } : { type })}
                />
                <RemoveBookmarkButton
                    uids={singleItem.bookmark.uid}
                    showConfirmModal={showConfirmModal}
                    {...(type === 'contextMenu' ? { close, type } : { type })}
                />
            </>
        );
    }

    return (
        <>
            <RemoveBookmarkButton
                uids={selectedBookmarks.map((item) => item.bookmark.uid)}
                showConfirmModal={showConfirmModal}
                {...(type === 'contextMenu' ? { close, type } : { type })}
            />
        </>
    );
};
