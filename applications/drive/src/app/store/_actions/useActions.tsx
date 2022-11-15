import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import { isSafari, textToClipboard } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import useConfirm from '../../hooks/util/useConfirm';
import useDevicesActions from '../_devices/useDevicesActions';
import { useDownload } from '../_downloads';
import { useLinkActions, useLinksActions } from '../_links';
import { useShareUrl } from '../_shares';
import useUploadFile from '../_uploads/UploadProvider/useUploadFile';
import { TransferConflictStrategy } from '../_uploads/interface';
import { ValidationError, useErrorHandler } from '../_utils';
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
        createMovedItemsNotifications,
        createTrashedItemsNotifications,
        createRestoredItemsNotifications,
        createDeletedItemsNotifications,
        createDeletedSharedLinksNotifications,
    } = useListNotifications();
    const { checkFirstBlockSignature } = useDownload();
    const { initFileUpload } = useUploadFile();
    const link = useLinkActions();
    const links = useLinksActions();
    const shareUrl = useShareUrl();
    const devicesActions = useDevicesActions();

    const createFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        name: string
    ): Promise<string> => {
        return link
            .createFolder(abortSignal, shareId, parentLinkId, name)
            .then((id: string) => {
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').t`"${name}" created successfully`}</span>,
                });
                return id;
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').t`"${name}" failed to be created`}</span>
                );
                throw e;
            });
    };

    const createFile = async (shareId: string, parentLinkId: string, name: string) => {
        const file = new File([], name, { type: 'text/plain' });
        const controls = initFileUpload(shareId, parentLinkId, file, async () => {
            throw new ValidationError(c('Error').t`"${name}" already exists`);
        });
        await controls
            .start()
            .then(() => {
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').t`"${name}" created successfully`}</span>,
                });
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').t`"${name}" failed to be created`}</span>
                );
                throw e;
            });
    };

    const saveFile = async (
        shareId: string,
        parentLinkId: string,
        name: string,
        mimeType: string,
        content: Uint8Array[]
    ) => {
        // saveFile is using file upload using name with replace strategy as
        // default. That's not the best way - better would be to use link ID
        // and also verify revision ID that file was not touched in meantime
        // by other client. But this is enough for first version to play with
        // the feature and see what all needs to be changed and implemented.
        const file = new File(content, name, { type: mimeType });
        const controls = initFileUpload(shareId, parentLinkId, file, async () => TransferConflictStrategy.Replace);
        await controls
            .start()
            .then(() => {
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').t`"${name}" saved successfully`}</span>,
                });
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').t`"${name}" failed to be saved`}</span>
                );
                throw e;
            });
    };

    const renameLink = async (abortSignal: AbortSignal, shareId: string, linkId: string, newName: string) => {
        // translator: ${newName} is for a folder or file name.
        const successNotificationText = c('Notification').t`"${newName}" renamed successfully`;
        // translator: ${newName} is for a folder or file name.
        const failNotificationText = c('Notification').t`"${newName}" failed to be renamed`;

        return link
            .renameLink(abortSignal, shareId, linkId, newName)
            .then(() => {
                createNotification({
                    text: <span className="text-pre-wrap">{successNotificationText}</span>,
                });
            })
            .catch((e) => {
                showErrorNotification(e, <span className="text-pre-wrap">{failNotificationText}</span>);
                throw e;
            });
    };

    const checkLinkSignatures = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [metaSignatureIssues, blockSignatureIssue] = await Promise.all([
            link.checkLinkMetaSignatures(abortSignal, shareId, linkId),
            // To avoid the need to download the whole file we assume that
            // either all blocks fail, or none, at least in most cases. So it
            // should be enough to check only the first block. During download
            // we check every single block, so user is still protected.
            checkFirstBlockSignature(abortSignal, shareId, linkId),
        ]).catch((e) => {
            showErrorNotification(e, <span>{c('Notification').t`Item failed to be verified`}</span>);
            throw e;
        });
        if (!metaSignatureIssues && !blockSignatureIssue) {
            return;
        }
        return {
            ...metaSignatureIssues,
            ...blockSignatureIssue,
        };
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
            const linkIdsPerParentId = Object.entries(result.originalParentIds).reduce(
                (acc, [linkId, originalParentId]) => {
                    (acc[originalParentId] ||= []).push(linkId);
                    return acc;
                },
                {} as { [parentLinkId: string]: string[] }
            );

            const undoResult = aggregateResults(
                await Promise.all(
                    Object.entries(linkIdsPerParentId).map(async ([parentLinkId, toMoveBackIds]) => {
                        return links.moveLinks(abortSignal, shareId, toMoveBackIds, parentLinkId);
                    })
                )
            );
            createMovedItemsNotifications(linksToMove, undoResult.successes, undoResult.failures);
        };

        createMovedItemsNotifications(linksToMove, result.successes, result.failures, undoAction);
    };

    const trashLinks = async (abortSignal: AbortSignal, linksToTrash: LinkInfo[]) => {
        if (!linksToTrash.length) {
            return;
        }

        const result = await links.trashLinks(
            abortSignal,
            linksToTrash.map(({ linkId, rootShareId, parentLinkId }) => ({
                linkId,
                shareId: rootShareId,
                parentLinkId,
            }))
        );

        const undoAction = async () => {
            const linksToUndo = result.successes
                .map((linkId) => linksToTrash.find((link) => link.linkId === linkId))
                .filter(isTruthy)
                .map((link) => ({ linkId: link.linkId, shareId: link.rootShareId }));

            const undoResult = await links.restoreLinks(abortSignal, linksToUndo);
            createRestoredItemsNotifications(linksToTrash, undoResult.successes, undoResult.failures);
        };

        createTrashedItemsNotifications(linksToTrash, result.successes, result.failures, undoAction);
    };

    const restoreLinks = async (abortSignal: AbortSignal, linksToRestore: LinkInfo[]) => {
        if (!linksToRestore.length) {
            return;
        }

        const result = await links.restoreLinks(
            abortSignal,
            linksToRestore.map(({ linkId, rootShareId }) => ({ linkId, shareId: rootShareId }))
        );

        const undoAction = async () => {
            const linksToTrash = result.successes
                .map((linkId) => linksToRestore.find((link) => link.linkId === linkId))
                .filter(isTruthy);

            await trashLinks(abortSignal, linksToTrash);
        };

        createRestoredItemsNotifications(linksToRestore, result.successes, result.failures, undoAction);
    };

    const deletePermanently = async (abortSignal: AbortSignal, linksToDelete: LinkInfo[]) => {
        if (linksToDelete.length === 0) {
            return;
        }

        const itemName = linksToDelete[0].name;
        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message =
            linksToDelete.length === 1
                ? c('Info').t`Are you sure you want to permanently delete "${itemName}" from trash?`
                : c('Info').t`Are you sure you want to permanently delete selected items from trash?`;

        openConfirmModal({
            title,
            confirm,
            message,
            onConfirm: async () => {
                const result = await links.deleteTrashedLinks(
                    abortSignal,
                    linksToDelete.map(({ linkId, rootShareId }) => ({ linkId, shareId: rootShareId }))
                );
                createDeletedItemsNotifications(linksToDelete, result.successes, result.failures);
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
                    .emptyTrash(abortSignal, shareId)
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

    const stopSharingLinks = (abortSignal: AbortSignal, linksToStopSharing: LinkInfo[]) => {
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
                const result = await shareUrl.deleteShareUrls(
                    abortSignal,
                    linksToStopSharing.map(({ linkId, rootShareId }) => ({ linkId, shareId: rootShareId }))
                );
                createDeletedSharedLinksNotifications(linksToStopSharing, result.successes, result.failures);
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

    const removeDevice = (deviceId: string, abortSignal: AbortSignal) => {
        return devicesActions
            .remove(deviceId, abortSignal)
            .then(() => {
                const notificationText = c('Notification').t`Device removed`;
                createNotification({ text: notificationText });
            })
            .catch((err) => {
                showErrorNotification(err, c('Notification').t`Device failed to be removed`);
                reportError(err);
            });
    };

    const renameDevice = (params: { deviceId: string; newName: string }, abortSignal?: AbortSignal) => {
        return devicesActions
            .rename(params, abortSignal)
            .then(() => {
                const notificationText = c('Notification').t`Device renamed`;
                createNotification({ text: notificationText });
            })
            .catch((err) => {
                showErrorNotification(err, c('Notification').t`Device failed to be renamed`);
                reportError(err);
            });
    };

    return {
        createFolder,
        createFile,
        saveFile,
        renameLink,
        checkLinkSignatures,
        moveLinks,
        trashLinks,
        restoreLinks,
        deletePermanently,
        emptyTrash,
        stopSharingLinks,
        copyShareLinkToClipboard,
        removeDevice,
        renameDevice,
    };
}

function aggregateResults(results: { successes: string[]; failures: { [linkId: string]: any } }[]) {
    return results.reduce(
        (acc, val) => {
            return {
                successes: [...acc.successes, ...val.successes],
                failures: { ...acc.failures, ...val.failures },
            };
        },
        { successes: [], failures: {} }
    );
}
