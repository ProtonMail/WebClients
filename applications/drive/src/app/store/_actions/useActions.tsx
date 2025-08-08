import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import { isSafari, textToClipboard } from '@proton/shared/lib/helpers/browser';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import isTruthy from '@proton/utils/isTruthy';

import { usePhotosWithAlbums } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { sendErrorReport } from '../../utils/errorHandling';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import useDevicesActions from '../_devices/useDevicesActions';
import { useLinkActions, useLinksActions } from '../_links';
import { useShareActions, useShareUrl } from '../_shares';
import useUploadFile from '../_uploads/UploadProvider/useUploadFile';
import { TransferConflictStrategy } from '../_uploads/interface';
import { useErrorHandler } from '../_utils';
import type { LinkInfo } from './interface';
import useListNotifications from './useListNotifications';

const safeName = (name: string) => <bdi>{name}</bdi>;

/**
 * useActions provides actions over links and its results is reported back
 * to user using notifications.
 *
 * {@return {confirmModal}} Only needed for deletePermanently/emptyTrash
 */
export default function useActions() {
    const { showErrorNotification } = useErrorHandler();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { createNotification } = useNotifications();
    const {
        createMovedItemsNotifications,
        createTrashedItemsNotifications,
        createRestoredItemsNotifications,
        createDeletedItemsNotifications,
    } = useListNotifications();
    const { initFileUpload } = useUploadFile();
    const link = useLinkActions();
    const links = useLinksActions();
    const shareUrl = useShareUrl();
    const shareActions = useShareActions();
    const devicesActions = useDevicesActions();
    const { removePhotosFromCache } = usePhotosWithAlbums();

    const createFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        newName: string
    ): Promise<string> => {
        const name = safeName(newName);

        return link
            .createFolder(abortSignal, shareId, parentLinkId, newName)
            .then((id: string) => {
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').jt`"${name}" created successfully`}</span>,
                });
                return id;
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').jt`"${name}" failed to be created`}</span>
                );
                throw e;
            });
    };

    const createFile = async (shareId: string, parentLinkId: string, newName: string) => {
        const file = new File([], newName, { type: 'text/plain' });
        const controls = initFileUpload(
            shareId,
            parentLinkId,
            file,
            async () => {
                const sanitizedName = rtlSanitize(newName);
                throw new ValidationError(c('Error').t`"${sanitizedName}" already exists`);
            },
            // Logging is not useful for single file creation.
            () => {}
        );

        const name = safeName(newName);
        await controls
            .start()
            .then(() => {
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').jt`"${name}" created successfully`}</span>,
                });
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').jt`"${name}" failed to be created`}</span>
                );
                throw e;
            });
    };

    const saveFile = async (
        shareId: string,
        parentLinkId: string,
        newName: string,
        mimeType: string,
        content: Uint8Array[]
    ) => {
        // saveFile is using file upload using name with replace strategy as
        // default. That's not the best way - better would be to use link ID
        // and also verify revision ID that file was not touched in meantime
        // by other client. But this is enough for first version to play with
        // the feature and see what all needs to be changed and implemented.
        const file = new File(content, newName, { type: mimeType });
        const controls = initFileUpload(
            shareId,
            parentLinkId,
            file,
            async () => TransferConflictStrategy.Replace,
            // Logging is not useful for single file updates.
            () => {}
        );

        const name = safeName(newName);
        await controls
            .start()
            .then(() => {
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').jt`"${name}" saved successfully`}</span>,
                });
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').jt`"${name}" failed to be saved`}</span>
                );
                throw e;
            });
    };

    const renameLink = async (abortSignal: AbortSignal, shareId: string, linkId: string, name: string) => {
        const newName = safeName(name);
        // translator: ${displayText} is for a folder or file name.
        const successNotificationText = c('Notification').jt`"${newName}" renamed successfully`;
        // translator: ${displayText} is for a folder or file name.
        const failNotificationText = c('Notification').jt`"${newName}" failed to be renamed`;

        return link
            .renameLink(abortSignal, shareId, linkId, name)
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

    const moveLinks = async (
        abortSignal: AbortSignal,
        {
            shareId,
            linksToMove,
            newParentLinkId,
            newShareId,
        }: {
            shareId: string;
            linksToMove: LinkInfo[];
            newParentLinkId: string;
            newShareId?: string;
        }
    ) => {
        if (!linksToMove.length) {
            return;
        }

        const linkIds = linksToMove.map(({ linkId }) => linkId);
        const result = await links.moveLinks(abortSignal, {
            shareId,
            linkIds,
            newParentLinkId,
            newShareId,
            silence: true,
        });

        // This is a bit ugly, but the photo linkId cache is not connected
        // very well to the rest of our state.
        removePhotosFromCache(result.successes);

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
                        return links.moveLinks(abortSignal, {
                            shareId,
                            linkIds: toMoveBackIds,
                            newParentLinkId: parentLinkId,
                            newShareId,
                            silence: true,
                        });
                    })
                )
            );
            createMovedItemsNotifications(linksToMove, undoResult.successes, undoResult.failures);
        };

        createMovedItemsNotifications(linksToMove, result.successes, result.failures, undoAction);
    };

    /**
     * @param [notify] - whether notification popover should be displayed upon
     * successful trash. Disabled on Docs
     */
    const trashLinks = async (abortSignal: AbortSignal, linksToTrash: LinkInfo[], notify = true) => {
        if (!linksToTrash.length) {
            return;
        }

        const result = await links.trashLinks(
            abortSignal,
            linksToTrash.map(({ linkId, rootShareId, volumeId }) => ({
                linkId,
                shareId: rootShareId,
                volumeId,
            }))
        );

        // This is a bit ugly, but the photo linkId cache is not connected
        // very well to the rest of our state.
        removePhotosFromCache(result.successes);

        if (notify) {
            const undoAction = async () => {
                const linksToUndo = result.successes
                    .map((linkId) => linksToTrash.find((link) => link.linkId === linkId))
                    .filter(isTruthy)
                    .map((link) => ({ linkId: link.linkId, shareId: link.rootShareId, volumeId: link.volumeId }));

                const undoResult = await links.restoreLinks(abortSignal, linksToUndo);
                createRestoredItemsNotifications(linksToTrash, undoResult.successes, undoResult.failures);
            };

            createTrashedItemsNotifications(linksToTrash, result.successes, result.failures, undoAction);
        }
    };

    /**
     * @param [notify] - whether notification popover should be displayed upon
     * successful trash. Disabled on Docs
     */
    const restoreLinks = async (abortSignal: AbortSignal, linksToRestore: LinkInfo[], notify = true) => {
        if (!linksToRestore.length) {
            return;
        }

        const result = await links.restoreLinks(
            abortSignal,
            linksToRestore.map(({ linkId, rootShareId, volumeId }) => ({ linkId, shareId: rootShareId, volumeId }))
        );

        if (notify) {
            const undoAction = async () => {
                const linksToTrash = result.successes
                    .map((linkId) => linksToRestore.find((link) => link.linkId === linkId))
                    .filter(isTruthy);

                await trashLinks(abortSignal, linksToTrash);
            };

            createRestoredItemsNotifications(linksToRestore, result.successes, result.failures, undoAction);
        }
    };

    const deletePermanently = async (abortSignal: AbortSignal, linksToDelete: LinkInfo[]) => {
        if (linksToDelete.length === 0) {
            return;
        }

        const itemName = linksToDelete[0].name;
        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message =
            linksToDelete.length === 1 && itemName
                ? c('Info').t`Are you sure you want to permanently delete "${itemName}" from trash?`
                : c('Info').t`Are you sure you want to permanently delete selected items from trash?`;

        void showConfirmModal({
            title,
            submitText: confirm,
            message,
            onSubmit: async () => {
                const result = await links.deleteTrashedLinks(
                    abortSignal,
                    linksToDelete.map(({ linkId, volumeId }) => ({ linkId, volumeId }))
                );
                createDeletedItemsNotifications(linksToDelete, result.successes, result.failures);
            },
        });
    };

    const emptyTrash = async (abortSignal: AbortSignal) => {
        const title = c('Title').t`Empty trash`;
        const confirm = c('Action').t`Empty trash`;
        const message = c('Info').t`Are you sure you want to empty trash and permanently delete all the items?`;

        void showConfirmModal({
            title,
            submitText: confirm,
            message,
            onSubmit: async () => {
                await links
                    .emptyTrash(abortSignal)
                    .then(() => {
                        const notificationText = c('Notification').t`All items deleted permanently from trash`;
                        createNotification({ text: notificationText });
                    })
                    .catch((err: any) => {
                        showErrorNotification(err, c('Notification').t`Trash failed to be emptied`);
                    });
            },
        });
    };

    // TODO: This can support multiple links in the future
    const stopSharing = (shareId: string) => {
        void showConfirmModal({
            title: c('Title').t`Stop sharing?`,
            submitText: c('Title').t`Stop sharing`,
            message: c('Info').t`This action will delete the link and revoke access for all users.`,
            onSubmit: () =>
                shareActions
                    .deleteShare(shareId, { force: true })
                    .then(() => {
                        createNotification({
                            text: c('Notification').t`You stopped sharing this item`,
                        });
                    })
                    .catch(() => {
                        createNotification({
                            type: 'error',
                            text: c('Notification').t`Stopping the sharing of this item has failed`,
                        });
                    }),
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
                      showErrorNotification(err, c('Notification').t`Cannot load link`);
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
                sendErrorReport(err);
            });
    };

    const renameDevice = async (
        params: { shareId: string; linkId: string; deviceId: string; newName: string; haveLegacyName: boolean },
        abortSignal?: AbortSignal
    ) => {
        await Promise.all([
            await link.renameLink(new AbortController().signal, params.shareId, params.linkId, params.newName),
            await devicesActions.rename(params, abortSignal),
        ])
            .then(() => {
                const notificationText = c('Notification').t`Device renamed`;
                createNotification({ text: notificationText });
            })
            .catch((err) => {
                showErrorNotification(err, c('Notification').t`Device failed to be renamed`);
                sendErrorReport(err);
            });
    };

    return {
        createFolder,
        createFile,
        saveFile,
        renameLink,
        moveLinks,
        trashLinks,
        restoreLinks,
        deletePermanently,
        emptyTrash,
        stopSharing,
        copyShareLinkToClipboard,
        removeDevice,
        renameDevice,
        confirmModal,
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
