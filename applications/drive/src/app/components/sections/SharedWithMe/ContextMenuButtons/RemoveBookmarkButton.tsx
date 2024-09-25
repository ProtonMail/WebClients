import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';

import { useBookmarksActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    token: string;
    linkId: string;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    close: () => void;
}
export const RemoveBookmarkButton = ({ showConfirmModal, token, linkId, close }: Props) => {
    const { deleteBookmark } = useBookmarksActions();

    return (
        <ContextMenuButton
            icon="cross-big"
            name={c('Action').t`Remove`}
            action={() => deleteBookmark(new AbortController().signal, showConfirmModal, { token, linkId })}
            close={close}
            testId="context-menu-remove-bookmark"
        />
    );
};
