import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useConfirmActionModal } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { useLinksActions } from '../_links';
import useLinkActions from '../_links/useLinkActions';
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
    const link = useLinkActions();
    const links = useLinksActions();

    const createFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        newName: string
    ): Promise<string> => {
        const ellipsedName = safeName(newName);

        return link
            .createFolder(abortSignal, shareId, parentLinkId, newName)
            .then((id: string) => {
                createNotification({
                    text: (
                        <span className="text-pre-wrap">{c('Notification')
                            .jt`"${ellipsedName}" created successfully`}</span>
                    ),
                });
                return id;
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification')
                        .jt`"${ellipsedName}" failed to be created`}</span>
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
        // removePhotosFromCache(result.successes);

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
     * successful trash.
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
        // removePhotosFromCache(result.successes);

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
     * successful trash.
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

    return {
        createFolder,
        renameLink,
        moveLinks,
        trashLinks,
        restoreLinks,
        deletePermanently,
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
