import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { ToolbarButton } from '@proton/components';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import { useBookmarksActions } from '../hooks/useBookmarksActions';

interface BaseProps {
    uids: string | string[];
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

type RemoveBookmarkButtonProps = ContextMenuProps | ToolbarProps;

export const RemoveBookmarkButton = ({ uids, showConfirmModal, close, buttonType }: RemoveBookmarkButtonProps) => {
    const { deleteBookmarks } = useBookmarksActions();
    const title = c('Action').t`Remove`;

    const handleRemoveBookmark = () => {
        void deleteBookmarks(showConfirmModal, Array.isArray(uids) ? uids : [uids]);
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcCrossBig alt={title} />}
                onClick={handleRemoveBookmark}
                data-testid="toolbar-delete-bookmark"
            />
        );
    }

    return (
        <ContextMenuButton
            icon={<IcCrossBig />}
            name={title}
            action={handleRemoveBookmark}
            close={close}
            testId="context-menu-remove-bookmark"
        />
    );
};
