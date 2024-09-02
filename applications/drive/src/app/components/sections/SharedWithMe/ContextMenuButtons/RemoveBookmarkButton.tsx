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
    const handleRemoveMe = () => {
        void showConfirmModal({
            title: c('Title').t`Are you sure you want to remove this item from your list?`,
            message: (
                <>
                    <span>{c('Info').t`You will need to save it again from the public link page`}</span>
                </>
            ),
            submitText: c('Action').t`Confirm`,
            onSubmit: async () => {
                return deleteBookmark(new AbortController().signal, { token, linkId });
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return (
        <ContextMenuButton
            icon="cross-big"
            name={c('Action').t`Remove`}
            action={handleRemoveMe}
            close={close}
            testId="shared-with-me-remove-bookmark"
        />
    );
};
