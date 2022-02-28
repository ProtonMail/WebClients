import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import { textToClipboard, isSafari } from '@proton/shared/lib/helpers/browser';

import useConfirm from '../../hooks/util/useConfirm';
import { useLinkActions, useLinksActions } from '../links';
import { useShareUrl } from '../shares';
import { useErrorHandler } from '../utils';
import { LinkInfo } from './interface';
import useListNotifications from './useListNotifications';

/**
 * useActions provides actions over links and its results is reported back
 * to user using notifications.
 */
export default function useAction() {
    const { showErrorNotification } = useErrorHandler();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();
    const {
        createDeleteLinksNotifications,
        createRestoredLinksNotifications,
        createMoveLinksNotifications,
        createTrashLinksNotifications,
        createDeleteSharedLinksNotifications,
    } = useListNotifications();
    const link = useLinkActions();
    const links = useLinksActions();
    const shareUrl = useShareUrl();

    const createFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        name: string
    ): Promise<string> => {
        return link
            .createFolder(abortSignal, shareId, parentLinkId, name)
            .then((id: string) => {
                const notificationText = (
                    <span key="name" style={{ whiteSpace: 'pre-wrap' }}>
                        {c('Success').t`"${name}" created successfully`}
                    </span>
                );
                createNotification({ text: notificationText });
                return id;
            })
            .catch((e) => {
                if (e.name === 'ValidationError') {
                    createNotification({ text: e.message, type: 'error' });
                }
                throw e;
            });
    };

    const renameLink = async (abortSignal: AbortSignal, shareId: string, linkId: string, newName: string) => {
        return link
            .renameLink(abortSignal, shareId, linkId, newName)
            .then(() => {
                const nameElement = (
                    <span key="name" style={{ whiteSpace: 'pre-wrap' }}>
                        &quot;{newName}&quot;
                    </span>
                );
                createNotification({ text: c('Success').jt`${nameElement} renamed successfully` });
            })
            .catch((e) => {
                if (e.name === 'ValidationError') {
                    createNotification({ text: e.message, type: 'error' });
                }
                throw e;
            });
    };

    const moveLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        linksToMove: LinkInfo[],
        newParentLinkId: string
    ) => {
        if (!linksToMove.length) {
            return;
        }

        const linkIds = linksToMove.map(({ linkId }) => linkId);
        const result = await links.moveLinks(abortSignal, shareId, linkIds, newParentLinkId);

        const undoAction = async () => {
            // One day this can be simplified to .groupBy((item) => item.parentLinkId)
            const movedLinksPerParentId = result.moved.reduce((acc, item) => {
                (acc[item.parentLinkId] ||= []).push(item);
                return acc;
            }, {} as { [parentLinkId: string]: LinkInfo[] });

            const moveBackResults = await Promise.all(
                Object.entries(movedLinksPerParentId).map(async ([parentLinkId, childsToMove]) => {
                    const toMoveBackIds = childsToMove.map(({ linkId }) => linkId);
                    const moveBackResult = await links.moveLinks(abortSignal, shareId, toMoveBackIds, parentLinkId);
                    return moveBackResult;
                })
            );
            const moveBackResult = moveBackResults.reduce(
                (acc, moveBackResult) => {
                    acc.moved = acc.moved.concat(moveBackResult.moved);
                    acc.failed = acc.failed.concat(moveBackResult.failed);
                    return acc;
                },
                { moved: [], failed: [] }
            );

            createMoveLinksNotifications(linksToMove, moveBackResult);
        };
        createMoveLinksNotifications(linksToMove, result, undoAction);
    };

    const trashLinks = async (abortSignal: AbortSignal, shareId: string, linksToTrash: LinkInfo[]) => {
        if (!linksToTrash.length) {
            return;
        }

        // One day this can be simplified to .groupBy((item) => item.parentLinkId)
        const linksToTrashPerParentId = linksToTrash.reduce((acc, item) => {
            (acc[item.parentLinkId] ||= []).push(item);
            return acc;
        }, {} as { [parentLinkId: string]: LinkInfo[] });

        const trashed = (
            await Promise.all(
                Object.entries(linksToTrashPerParentId).map(async ([parentLinkId, childsToTrash]) => {
                    const linkIds = childsToTrash.map(({ linkId }) => linkId);
                    const { done: trashed } = await links.trashLinks(abortSignal, shareId, parentLinkId, linkIds);
                    return trashed;
                })
            )
        ).flat();

        const undoAction = async () => {
            const linkIds = linksToTrash.map(({ linkId }) => linkId);
            const result = await links.restoreLinks(abortSignal, shareId, linkIds);
            createRestoredLinksNotifications(linksToTrash, result);
        };
        createTrashLinksNotifications(linksToTrash, trashed, undoAction);
    };

    const restoreLinks = async (abortSignal: AbortSignal, shareId: string, linksToRestore: LinkInfo[]) => {
        if (!linksToRestore.length) {
            return;
        }

        const result = await links.restoreLinks(
            abortSignal,
            shareId,
            linksToRestore.map(({ linkId }) => linkId)
        );
        createRestoredLinksNotifications(linksToRestore, result);
    };

    const deletePermanently = async (abortSignal: AbortSignal, shareId: string, linksToDelete: LinkInfo[]) => {
        if (!linksToDelete.length) {
            return;
        }

        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message = c('Info').ngettext(
            msgid`Are you sure you want to permanently delete selected item from trash?`,
            `Are you sure you want to permanently delete selected items from trash?`,
            linksToDelete.length
        );

        openConfirmModal({
            title,
            confirm,
            message,
            onConfirm: async () => {
                const { done: deleted } = await links.deleteTrashedLinks(
                    abortSignal,
                    shareId,
                    linksToDelete.map(({ linkId }) => linkId)
                );
                createDeleteLinksNotifications(linksToDelete, deleted);
            },
        });
    };

    const emptyTrash = async (abortSignal: AbortSignal, shareId: string) => {
        const title = c('Title').t`Empty trash`;
        const confirm = c('Action').t`Empty trash`;
        const message = c('Info').t`Are you sure you want to empty trash and permanently delete all the items?`;

        openConfirmModal({
            title,
            confirm,
            message,
            onConfirm: async () => {
                await links
                    .deleteTrash(abortSignal, shareId)
                    .then(() => {
                        const notificationText = c('Notification')
                            .t`All items will soon be permanently deleted from trash`;
                        createNotification({ text: notificationText });
                    })
                    .catch((err: any) => {
                        showErrorNotification(err, c('Notification').t`Trash failed to be emptied`);
                    });
            },
        });
    };

    const stopSharingLinks = (abortSignal: AbortSignal, shareId: string, linksToStopSharing: LinkInfo[]) => {
        if (!linksToStopSharing.length) {
            return;
        }

        openConfirmModal({
            title: c('Title').t`Stop sharing`,
            confirm: c('Title').t`Stop sharing`,
            message: c('Info').ngettext(
                msgid`This will delete the link and remove access to your file or folder for anyone with the link.`,
                `This will delete the links and remove access to your files or folders for anyone with the links.`,
                linksToStopSharing.length
            ),
            onConfirm: async () => {
                const linkIds = linksToStopSharing.map(({ linkId }) => linkId);
                const deletedCount = await shareUrl.deleteShareUrls(abortSignal, shareId, linkIds);
                const failedCount = linksToStopSharing.length - deletedCount;
                createDeleteSharedLinksNotifications(deletedCount, failedCount);
            },
        });
    };

    // Safari does not allow copy to clipboard outside of the event
    // (e.g., click). No await or anything does not do the trick.
    // Clipboard API also doesn't work. Therefore we cannot have this
    // feature on Safari at this moment.
    const copyShareLinkToClipboard = isSafari()
        ? undefined
        : async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
              return shareUrl
                  .loadShareUrlLink(abortSignal, shareId, linkId)
                  .then((url) => {
                      if (url) {
                          textToClipboard(url);
                          createNotification({
                              text: c('Info').t`Link copied to clipboard`,
                          });
                      }
                  })
                  .catch((err: any) => {
                      showErrorNotification(err, c('Notification').t`Link failed to be loaded`);
                  });
          };

    return {
        createFolder,
        renameLink,
        moveLinks,
        trashLinks,
        restoreLinks,
        deletePermanently,
        emptyTrash,
        stopSharingLinks,
        copyShareLinkToClipboard,
    };
}
