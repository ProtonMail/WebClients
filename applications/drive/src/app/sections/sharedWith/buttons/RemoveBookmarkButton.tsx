import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Icon, ToolbarButton } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useBookmarksActions } from '../../../hooks/drive/useBookmarksActions';
import { useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

interface BaseProps {
    uids: string | string[];
}

interface ContextMenuProps extends BaseProps {
    type: 'contextMenu';
    close: () => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ToolbarProps extends BaseProps {
    type: 'toolbar';
    close?: never;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

type RemoveBookmarkButtonProps = ContextMenuProps | ToolbarProps;

export const RemoveBookmarkButton = ({ uids, showConfirmModal, close, type }: RemoveBookmarkButtonProps) => {
    const { deleteBookmarks } = useBookmarksActions();
    const removeSharedWithMeItemFromStore = useSharedWithMeListingStore(
        useShallow((state) => state.removeSharedWithMeItem)
    );

    const handleRemoveBookmark = () => {
        void deleteBookmarks(showConfirmModal, Array.isArray(uids) ? uids : [uids], (removedUids) =>
            removedUids.map(removeSharedWithMeItemFromStore)
        );
    };

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Remove`}
                icon={<Icon name="cross-big" alt={c('Action').t`Remove`} />}
                onClick={handleRemoveBookmark}
                data-testid="toolbar-remove-bookmark"
            />
        );
    }

    return (
        <ContextMenuButton
            icon="cross-big"
            name={c('Action').t`Remove`}
            action={handleRemoveBookmark}
            close={close}
            testId="context-menu-remove-bookmark"
        />
    );
};
