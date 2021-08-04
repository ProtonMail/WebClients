import { c, msgid } from 'ttag';
import { useNotifications, InlineLinkButton } from '@proton/components';
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
                <InlineLinkButton onClick={() => undoAction()}>{c('Action').t`Undo`}</InlineLinkButton>
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
                    ? c('Notification').t`"${firstItemName}" deleted permanently from trash`
                    : c('Notification').ngettext(
                          msgid`${deletedItemsCount} file deleted permanently from trash`,
                          `${deletedItemsCount} files deleted permanently from trash`,
                          deletedItemsCount
                      ),
            allFolders:
                deletedItemsCount === 1
                    ? c('Notification').t`"${firstItemName}" deleted permanently from trash`
                    : c('Notification').ngettext(
                          msgid`${deletedItemsCount} folder deleted permanently from trash`,
                          `${deletedItemsCount} folders deleted permanently from trash`,
                          deletedItemsCount
                      ),
            mixed:
                deletedItemsCount === 1
                    ? c('Notification').t`"${firstItemName}" deleted permanently from trash`
                    : c('Notification').ngettext(
                          msgid`${deletedItemsCount} item deleted permanently from trash`,
                          `${deletedItemsCount} items deleted permanently from trash`,
                          deletedItemsCount
                      ),
        };

        const notificationText = getNotificationTextForItemList(
            toDelete.map((item) => item.Type),
            notificationMessages
        );
        createNotification({ text: <span className="text-pre-wrap">{notificationText}</span> });
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
                    ? c('Notification').t`"${firstItemName}" moved to trash`
                    : c('Notification').ngettext(
                          msgid`${trashedLinksCount} file moved to trash`,
                          `${trashedLinksCount} files moved to trash`,
                          trashedLinksCount
                      ),
            allFolders:
                trashedLinksCount === 1
                    ? c('Notification').t`"${firstItemName}" moved to trash`
                    : c('Notification').ngettext(
                          msgid`${trashedLinksCount} folder moved to trash`,
                          `${trashedLinksCount} folders moved to trash`,
                          trashedLinksCount
                      ),
            mixed:
                trashedLinksCount === 1
                    ? c('Notification').t`"${firstItemName}" moved to trash`
                    : c('Notification').ngettext(
                          msgid`${trashedLinksCount} item moved to trash`,
                          `${trashedLinksCount} items moved to trash`,
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
            text: <span className="text-pre-wrap">{movedToTrashText}</span>,
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
                        ? c('Notification').t`"${firstItemName}" restored from trash`
                        : c('Notification').ngettext(
                              msgid`${restoredItemsCount} file restored from trash`,
                              `${restoredItemsCount} files restored from trash`,
                              restoredItemsCount
                          ),
                allFolders:
                    restoredItemsCount === 1
                        ? c('Notification').t`"${firstItemName}" restored from trash`
                        : c('Notification').ngettext(
                              msgid`${restoredItemsCount} folder restored from trash`,
                              `${restoredItemsCount} folders restored from trash`,
                              restoredItemsCount
                          ),
                mixed:
                    restoredItemsCount === 1
                        ? c('Notification').t`"${firstItemName}" restored from trash`
                        : c('Notification').ngettext(
                              msgid`${restoredItemsCount} item restored from trash`,
                              `${restoredItemsCount} items restored from trash`,
                              restoredItemsCount
                          ),
            };

            const notificationText = getNotificationTextForItemList(
                toRestore.map((item) => item.Type),
                notificationMessages
            );
            createNotification({ text: <span className="text-pre-wrap">{notificationText}</span>, type: 'success' });
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
                text: <span className="text-pre-wrap">{notificationMessage}</span>,
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
            text: <span className="text-pre-wrap">{notificationMessage}</span>,
        });
    };

    const createDeleteSharedLinksNotifications = (deletedCount: number, failedCount: number) => {
        if (deletedCount) {
            const notificationText =
                deletedCount === 1
                    ? c('Notification').t`The link to your file was deleted.`
                    : c('Notification').ngettext(
                          msgid`${deletedCount} link to your file was deleted.`,
                          `${deletedCount} links to your files were deleted.`,
                          deletedCount
                      );

            createNotification({ text: notificationText });
        }

        if (failedCount) {
            const notificationText =
                failedCount === 1
                    ? c('Notification').t`The link to your file failed to be deleted.`
                    : c('Notification').ngettext(
                          msgid`${failedCount} link to your file failed to be deleted.`,
                          `${failedCount} links to your files failed to be deleted.`,
                          failedCount
                      );

            createNotification({ text: notificationText, type: 'error' });
        }
    };

    return {
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
        createMoveLinksNotifications,
        createDeleteLinksNotifications,
        createDeleteSharedLinksNotifications,
    };
};

export default useListNotifications;
