import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton, useConfirmActionModal } from '@proton/components';

import { useBookmarksActions } from '../../../../store';

interface Props {
    selectedBrowserItems: { isBookmark?: boolean; linkId: string; bookmarkDetails?: { token: string } }[];
}
export const RemoveBookmarkButton = ({ selectedBrowserItems }: Props) => {
    const { deleteBookmarks } = useBookmarksActions();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    // Even if the RemoveBookmarkButton toolbar button is only showed if only bookmarks are selected,
    // it's safer to dobule check
    const itemsToDelete = useMemo(
        () =>
            selectedBrowserItems.reduce(
                (acc, selectedBrowserItem) => {
                    if (selectedBrowserItem.bookmarkDetails) {
                        acc.push({
                            token: selectedBrowserItem.bookmarkDetails.token,
                            linkId: selectedBrowserItem.linkId,
                        });
                    }
                    return acc;
                },
                [] as { token: string; linkId: string }[]
            ),
        [selectedBrowserItems]
    );

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Remove`}
                icon={<Icon name="cross-big" alt={c('Action').t`Remove`} />}
                onClick={() => deleteBookmarks(new AbortController().signal, showConfirmModal, itemsToDelete)}
                data-testid="toolbar-delete-bookmark"
            />
            {confirmModal}
        </>
    );
};
