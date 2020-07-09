import React from 'react';
import { c, msgid } from 'ttag';
import { useNotifications, LinkButton } from 'react-components';
import { LinkType } from '../../interfaces/link';
import { selectMessageForItemList } from '../../components/Drive/helpers';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';

const getNotificationTextForItemList = (
    types: LinkType[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    },
    undoAction?: () => void
) => {
    const notificationText = selectMessageForItemList(types, messages);

    if (undoAction) {
        return (
            <>
                {notificationText}
                {'. '}
                <LinkButton
                    className="alignbaseline nodecoration bold pm-button--currentColor"
                    onClick={() => undoAction()}
                >
                    {c('Action').t`Undo`}
                </LinkButton>
            </>
        );
    }

    return notificationText;
};

const useListNotifications = () => {
    const { createNotification } = useNotifications();

    const createDeleteLinksNotifications = (toDelete: FileBrowserItem[], deletedIds: string[]) => {
        const deletedItemsCount = deletedIds.length;

        if (!deletedItemsCount) {
            return;
        }

        const first = toDelete.find(({ LinkID }) => LinkID === deletedIds[0]);
        const firstItemName = first?.Name;

        const notificationMessages = {
            allFiles: c('Notification').ngettext(
                msgid`"${firstItemName}" deleted permanently from Trash`,
                `${deletedItemsCount} files deleted permanently from Trash`,
                deletedItemsCount
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${firstItemName}" deleted permanently from Trash`,
                `${deletedItemsCount} folders deleted permanently from Trash`,
                deletedItemsCount
            ),
            mixed: c('Notification').ngettext(
                msgid`"${firstItemName}" deleted permanently from Trash`,
                `${deletedItemsCount} items deleted permanently from Trash`,
                deletedItemsCount
            ),
        };

        const notificationText = getNotificationTextForItemList(
            toDelete.map((item) => item.Type),
            notificationMessages
        );
        createNotification({ text: notificationText });
    };

    const createTrashLinksNotifications = (toTrash: FileBrowserItem[], trashedIds: string[], undoAction: () => any) => {
        const trashedLinksCount = trashedIds.length;

        if (!trashedLinksCount) {
            return;
        }

        const first = toTrash.find(({ LinkID }) => LinkID === trashedIds[0]);
        const firstItemName = first?.Name;

        const notificationMessages = {
            allFiles: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash`,
                `${trashedLinksCount} files moved to Trash`,
                trashedLinksCount
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash`,
                `${trashedLinksCount} folders moved to Trash`,
                trashedLinksCount
            ),
            mixed: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash`,
                `${trashedLinksCount} items moved to Trash`,
                trashedLinksCount
            ),
        };

        const movedToTrashText = getNotificationTextForItemList(
            toTrash.map((item) => item.Type),
            notificationMessages,
            undoAction
        );
        createNotification({
            type: 'success',
            text: movedToTrashText,
        });
    };

    const createRestoredLinksNotifications = (
        toRestore: FileBrowserItem[],
        {
            restored,
            alreadyExisting,
            otherErrors,
        }: {
            restored: string[];
            alreadyExisting: string[];
            otherErrors: string[];
        }
    ) => {
        const restoredItemsCount = restored.length;
        if (restoredItemsCount) {
            const first = toRestore.find(({ LinkID }) => LinkID === restored[0]);
            const firstItemName = first?.Name;
            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${restoredItemsCount} files restored from Trash`,
                    restoredItemsCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${restoredItemsCount} folders restored from Trash`,
                    restoredItemsCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${restoredItemsCount} items restored from Trash`,
                    restoredItemsCount
                ),
            };

            const notificationText = getNotificationTextForItemList(
                toRestore.map((item) => item.Type),
                notificationMessages
            );
            createNotification({ text: notificationText, type: 'success' });
        }

        alreadyExisting.forEach((linkId) => {
            const item = toRestore.find(({ LinkID }) => LinkID === linkId);
            const name = item?.Name;
            const notificationText = c('Notification')
                .t`An item with the name "${name}" already exists in the current folder`;
            createNotification({ text: notificationText, type: 'error' });
        });

        otherErrors.forEach((error) => {
            createNotification({ text: error, type: 'error' });
        });
    };

    const createMoveLinksNotifications = (
        toMove: FileBrowserItem[],
        {
            moved,
            failed,
        }: {
            moved: {
                Name: string;
                Type: LinkType;
            }[];
            failed: string[];
        }
    ) => {
        const movedLinksCount = moved.length;
        const failedMovesCount = failed.length;

        if (movedLinksCount) {
            const [{ Name: firstItemName }] = moved;
            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`"${firstItemName}" successfully moved`,
                    `${movedLinksCount} files successfully moved`,
                    movedLinksCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`"${firstItemName}" successfully moved`,
                    `${movedLinksCount} folders successfully moved`,
                    movedLinksCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`"${firstItemName}" successfully moved`,
                    `${movedLinksCount} items successfully moved`,
                    movedLinksCount
                ),
            };
            const notificationMessage = getNotificationTextForItemList(
                moved.map((item) => item.Type),
                notificationMessages
            );

            createNotification({
                type: 'success',
                text: notificationMessage,
            });
        }

        if (!failedMovesCount) {
            return;
        }

        const first = toMove.find(({ LinkID }) => LinkID === failed[0]);
        const firstItemName = first?.Name;
        const notificationMessages = {
            allFiles: c('Notification').ngettext(
                msgid`"${firstItemName}" failed to be moved`,
                `${failedMovesCount} files failed to be moved`,
                failedMovesCount
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${firstItemName}" failed to be moved`,
                `${failedMovesCount} folders failed to be moved`,
                failedMovesCount
            ),
            mixed: c('Notification').ngettext(
                msgid`"${firstItemName}" failed to be moved`,
                `${failedMovesCount} items failed to be moved`,
                failedMovesCount
            ),
        };

        const notificationMessage = getNotificationTextForItemList(
            failed.map((failedLinkId) => toMove.find(({ LinkID }) => LinkID === failedLinkId)?.Type ?? LinkType.FILE),
            notificationMessages
        );
        createNotification({
            type: 'error',
            text: notificationMessage,
        });
    };

    return {
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
        createMoveLinksNotifications,
        createDeleteLinksNotifications,
    };
};

export default useListNotifications;
