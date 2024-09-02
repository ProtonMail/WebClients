import { c, msgid } from 'ttag';

import { Icon, ToolbarButton, useConfirmActionModal } from '@proton/components';

import { useBookmarksActions } from '../../../../store';

interface Props {
    selectedBrowserItems: { isBookmark?: boolean; linkId: string; bookmarkDetails?: { token: string } }[];
}
export const RemoveBookmarkButton = ({ selectedBrowserItems }: Props) => {
    const { deleteBookmarks } = useBookmarksActions();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const handleRemoveMe = () => {
        void showConfirmModal({
            title: c('Info').ngettext(
                msgid`Are you sure you want to remove this item from your list?`,
                `Are you sure you want to remove those items from your list?`,
                selectedBrowserItems.length
            ),
            message: c('Info').t`You will need to save it again from the public link page`,
            submitText: c('Action').t`Confirm`,
            onSubmit: async () => {
                const abortSignal = new AbortController().signal;
                return deleteBookmarks(
                    abortSignal,
                    selectedBrowserItems.map((selectedBrowserItem) => ({
                        // We filter it above so we can force the presence of bookmarkDetails
                        token: selectedBrowserItem.bookmarkDetails!.token,
                        linkId: selectedBrowserItem.linkId,
                    }))
                );
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Remove`}
                icon={<Icon name="cross-big" alt={c('Action').t`Remove`} />}
                onClick={() => handleRemoveMe()}
                data-testid="toolbar-delete-bookmark"
            />
            {confirmModal}
        </>
    );
};
