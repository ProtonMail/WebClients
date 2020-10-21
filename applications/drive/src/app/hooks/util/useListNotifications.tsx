import React from 'react';
import { c, msgid } from 'ttag';
import { useNotifications, LinkButton } from 'react-components';
import { LinkType, LinkMeta } from '../../interfaces/link';
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
            allFiles:
                deletedItemsCount === 1
                    ? c('Notification').t`"${firstItemName}" deleted permanently from Trash`
                    : c('Notification').ngettext(
                          msgid`${deletedItemsCount} file deleted permanently from Trash`,
                          `${deletedItemsCount} files deleted permanently from Trash`,
                          deletedItemsCount
                      ),
            allFolders:
                deletedItemsCount === 1
                    ? c('Notification').t`"${firstItemName}" deleted permanently from Trash`
                    : c('Notification').ngettext(
                          msgid`${deletedItemsCount} folder deleted permanently from Trash`,
                          `${deletedItemsCount} folders deleted permanently from Trash`,
                          deletedItemsCount
                      ),
            mixed:
                deletedItemsCount === 1
                    ? c('Notification').t`"${firstItemName}" deleted permanently from Trash`
                    : c('Notification').ngettext(
                          msgid`${deletedItemsCount} item deleted permanently from Trash`,
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
            allFiles:
                trashedLinksCount === 1
                    ? c('Notification').t`"${firstItemName}" moved to Trash`
                    : c('Notification').ngettext(
                          msgid`${trashedLinksCount} file moved to Trash`,
                          `${trashedLinksCount} files moved to Trash`,
                          trashedLinksCount
                      ),
            allFolders:
                trashedLinksCount === 1
                    ? c('Notification').t`"${firstItemName}" moved to Trash`
                    : c('Notification').ngettext(
                          msgid`${trashedLinksCount} folder moved to Trash`,
                          `${trashedLinksCount} folders moved to Trash`,
                          trashedLinksCount
                      ),
            mixed:
                trashedLinksCount === 1
                    ? c('Notification').t`"${firstItemName}" moved to Trash`
                    : c('Notification').ngettext(
                          msgid`${trashedLinksCount} item moved to Trash`,
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
                allFiles:
                    restoredItemsCount === 1
                        ? c('Notification').t`"${firstItemName}" restored from Trash`
                        : c('Notification').ngettext(
                              msgid`${restoredItemsCount} file restored from Trash`,
                              `${restoredItemsCount} files restored from Trash`,
                              restoredItemsCount
                          ),
                allFolders:
                    restoredItemsCount === 1
                        ? c('Notification').t`"${firstItemName}" restored from Trash`
                        : c('Notification').ngettext(
                              msgid`${restoredItemsCount} folder restored from Trash`,
                              `${restoredItemsCount} folders restored from Trash`,
                              restoredItemsCount
                          ),
                mixed:
                    restoredItemsCount === 1
                        ? c('Notification').t`"${firstItemName}" restored from Trash`
                        : c('Notification').ngettext(
                              msgid`${restoredItemsCount} item restored from Trash`,
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
        toMove: (FileBrowserItem | LinkMeta)[],
        {
            moved,
            failed,
        }: {
            moved: {
                Name: string;
                Type: LinkType;
            }[];
            failed: string[];
        },
        undoAction?: () => any
    ) => {
        const movedLinksCount = moved.length;
        const failedMovesCount = failed.length;

        if (movedLinksCount) {
            const [{ Name: firstItemName }] = moved;
            const notificationMessages = {
                allFiles:
                    movedLinksCount === 1
                        ? c('Notification').t`"${firstItemName}" successfully moved`
                        : c('Notification').ngettext(
                              msgid`${movedLinksCount} file successfully moved`,
                              `${movedLinksCount} files successfully moved`,
                              movedLinksCount
                          ),
                allFolders:
                    movedLinksCount === 1
                        ? c('Notification').t`"${firstItemName}" successfully moved`
                        : c('Notification').ngettext(
                              msgid`${movedLinksCount} folder successfully moved`,
                              `${movedLinksCount} folders successfully moved`,
                              movedLinksCount
                          ),
                mixed:
                    movedLinksCount === 1
                        ? c('Notification').t`"${firstItemName}" successfully moved`
                        : c('Notification').ngettext(
                              msgid`${movedLinksCount} item successfully moved`,
                              `${movedLinksCount} items successfully moved`,
                              movedLinksCount
                          ),
            };
            const notificationMessage = getNotificationTextForItemList(
                moved.map((item) => item.Type),
                notificationMessages,
                undoAction
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
            allFiles:
                failedMovesCount === 1
                    ? c('Notification').t`"${firstItemName}" failed to be moved`
                    : c('Notification').ngettext(
                          msgid`${failedMovesCount} file failed to be moved`,
                          `${failedMovesCount} files failed to be moved`,
                          failedMovesCount
                      ),
            allFolders:
                failedMovesCount === 1
                    ? c('Notification').t`"${firstItemName}" failed to be moved`
                    : c('Notification').ngettext(
                          msgid`${failedMovesCount} folder failed to be moved`,
                          `${failedMovesCount} folders failed to be moved`,
                          failedMovesCount
                      ),
            mixed:
                failedMovesCount === 1
                    ? c('Notification').t`"${firstItemName}" failed to be moved`
                    : c('Notification').ngettext(
                          msgid`${failedMovesCount} item failed to be moved`,
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
