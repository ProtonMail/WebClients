import React, { useEffect } from 'react';
import { c, msgid } from 'ttag';

import { ToolbarSeparator, Toolbar, ToolbarButton, useModals, useNotifications, useLoading } from 'react-components';

import { getMetaForTransfer } from './Drive';
import { useDriveContent } from './DriveContentProvider';
import useFiles from '../../hooks/useFiles';
import useTrash from '../../hooks/useTrash';
import useDrive from '../../hooks/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import CreateFolderModal from '../CreateFolderModal';
import RenameModal from '../RenameModal';
import DetailsModal from '../DetailsModal';
import MoveToFolderModal from '../MoveToFolderModal';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getNotificationTextForItemList } from './helpers';
import { DriveFolder } from './DriveFolderProvider';
import { LinkType } from '../../interfaces/link';
import { isPreviewAvailable } from '../FilePreview/FilePreview';
import runInQueue from '../../utils/runInQueue';
import SortDropdown from './SortDropdown';
import usePreventLeave from '../../hooks/usePreventLeave';

const MAX_THREADS_PER_MOVE = 5;

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const DriveToolbar = ({ activeFolder, openLink }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { fileBrowserControls } = useDriveContent();
    const { preventLeave } = usePreventLeave();
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const {
        getFoldersOnlyMetas,
        getShareMeta,
        getLinkMeta,
        createNewFolder,
        renameLink,
        moveLink,
        events
    } = useDrive();
    const { trashLinks, restoreLinks } = useTrash();
    const [moveToTrashLoading, withMoveToTrashLoading] = useLoading();
    const cache = useDriveCache();

    const { linkId, shareId } = activeFolder;

    const ParentLinkID = cache.get.linkMeta(shareId, linkId)?.ParentLinkID;
    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        if (!ParentLinkID) {
            getLinkMeta(shareId, linkId);
        }
    }, [shareId, linkId, ParentLinkID]);

    const handleBackClick = () => {
        if (ParentLinkID) {
            openLink(shareId, ParentLinkID, LinkType.FOLDER);
        }
    };

    const handlePreview = () => {
        const item = selectedItems[0];
        const { shareId } = activeFolder;

        openLink(shareId, item.LinkID, item.Type);
    };

    const handleDownloadClick = () => {
        selectedItems.forEach(async (item) => {
            if (item.Type === LinkType.FILE) {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
                FileSaver.saveAsFile(fileStream, meta);
            } else {
                const zipSaver = await FileSaver.saveAsZip(item.Name);

                if (zipSaver) {
                    try {
                        await startFolderTransfer(item.Name, shareId, item.LinkID, {
                            onStartFileTransfer: zipSaver.addFile,
                            onStartFolderTransfer: zipSaver.addFolder
                        });
                        zipSaver.close();
                    } catch (e) {
                        zipSaver.abort(e);
                    }
                }
            }
        });
    };

    const handleCreateFolder = async () => {
        createModal(
            <CreateFolderModal
                createNewFolder={async (name) => {
                    await createNewFolder(shareId, linkId, name);
                    events.call(shareId);
                }}
            />
        );
    };

    const handleRename = () => {
        const item = selectedItems[0];
        createModal(
            <RenameModal
                item={item}
                renameLink={async (name) => {
                    await renameLink(shareId, item.LinkID, item.ParentLinkID, name, item.Type);
                    events.call(shareId);
                }}
            />
        );
    };

    const handleDetailsClick = () => {
        createModal(<DetailsModal item={selectedItems[0]} activeFolder={activeFolder} getLinkMeta={getLinkMeta} />);
    };

    const moveToTrash = async () => {
        const toTrash = selectedItems;
        await trashLinks(
            shareId,
            linkId,
            toTrash.map(({ LinkID }) => LinkID)
        );

        const trashedLinksCount = toTrash.length;
        const [{ Name: firstItemName }] = toTrash;

        const undoAction = async () => {
            await restoreLinks(
                shareId,
                toTrash.map(({ LinkID }) => LinkID)
            );

            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${trashedLinksCount} files restored from Trash`,
                    trashedLinksCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${trashedLinksCount} folders restored from Trash`,
                    trashedLinksCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${trashedLinksCount} items restored from Trash`,
                    trashedLinksCount
                )
            };

            const notificationText = getNotificationTextForItemList(
                toTrash.map((item) => item.Type),
                notificationMessages
            );
            createNotification({ text: notificationText });
            await events.call(shareId);
        };

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
            )
        };

        const movedToTrashText = getNotificationTextForItemList(
            toTrash.map((item) => item.Type),
            notificationMessages,
            undoAction
        );
        createNotification({
            type: 'success',
            text: movedToTrashText
        });
        await events.call(shareId);
    };

    const moveToFolder = () => {
        const toMove = selectedItems;

        createModal(
            <MoveToFolderModal
                activeFolder={activeFolder}
                selectedItems={toMove}
                getShareMeta={getShareMeta}
                getLinkMeta={getLinkMeta}
                getFoldersOnlyMetas={getFoldersOnlyMetas}
                isChildrenComplete={(LinkID: string) => !!cache.get.foldersOnlyComplete(shareId, LinkID)}
                moveLinksToFolder={async (parentFolderId: string) => {
                    const movedLinks: { Name: string; Type: LinkType }[] = [];
                    const failedMoves: { Name: string; Type: LinkType }[] = [];
                    const moveQueue = toMove.map((link, i) => async () => {
                        await moveLink(shareId, parentFolderId, link.LinkID)
                            .then((result) => {
                                movedLinks.push(result);
                            })
                            .catch((error) => {
                                if (error.name === 'Error') {
                                    failedMoves.push({ Name: toMove[i].Name, Type: toMove[i].Type });
                                    console.error(`Failed to move file "${toMove[i].Name}": ${error}`);
                                }
                            });
                    });
                    await preventLeave(runInQueue(moveQueue, MAX_THREADS_PER_MOVE));

                    const movedLinksCount = movedLinks.length;
                    const failedMovesCount = failedMoves.length;

                    if (movedLinksCount > 0) {
                        const [{ Name: firstItemName }] = movedLinks;
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
                            )
                        };
                        const notificationMessage = getNotificationTextForItemList(
                            movedLinks.map((item) => item.Type),
                            notificationMessages
                        );

                        createNotification({
                            type: 'success',
                            text: notificationMessage
                        });
                    }

                    if (failedMovesCount > 0) {
                        const [{ Name: firstItemName }] = failedMoves;
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
                                msgid`"${failedMovesCount}" failed to be moved`,
                                `${failedMovesCount} items failed to be moved`,
                                failedMovesCount
                            )
                        };

                        const notificationMessage = getNotificationTextForItemList(
                            failedMoves.map((item) => item.Type),
                            notificationMessages
                        );
                        createNotification({
                            type: 'error',
                            text: notificationMessage
                        });
                    }

                    await events.call(shareId);
                }}
                openCreateFolderModal={handleCreateFolder}
            />
        );
    };

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return <ToolbarButton icon="folder-new" title={c('Action').t`New Folder`} onClick={handleCreateFolder} />;
        }

        const isMultiSelect = selectedItems.length > 1;
        const hasFoldersSelected = selectedItems.some((item) => item.Type === LinkType.FOLDER);
        const isPreviewDisabled =
            isMultiSelect ||
            hasFoldersSelected ||
            !selectedItems[0].MimeType ||
            !isPreviewAvailable(selectedItems[0].MimeType);

        return (
            <>
                <ToolbarButton
                    disabled={isPreviewDisabled}
                    title={c('Action').t`Preview`}
                    icon="read"
                    onClick={handlePreview}
                />
                <ToolbarButton title={c('Action').t`Download`} icon="download" onClick={handleDownloadClick} />
                <ToolbarButton
                    disabled={isMultiSelect}
                    title={c('Action').t`Rename`}
                    icon="file-edit"
                    onClick={handleRename}
                />
                <ToolbarButton
                    disabled={isMultiSelect}
                    title={c('Action').t`Details`}
                    icon="info"
                    onClick={handleDetailsClick}
                />

                <ToolbarSeparator />

                <ToolbarButton
                    disabled={moveToTrashLoading}
                    title={c('Action').t`Move to Trash`}
                    icon="trash"
                    onClick={() => withMoveToTrashLoading(moveToTrash())}
                />
                <ToolbarButton
                    title={c('Action').t`Move to Folder`}
                    icon="arrow-cross"
                    onClick={() => moveToFolder()}
                />
            </>
        );
    };

    return (
        <Toolbar>
            <ToolbarButton
                disabled={!ParentLinkID}
                title={c('Action').t`Back`}
                onClick={handleBackClick}
                icon="arrow-left"
            />

            <ToolbarSeparator />

            {renderSelectionActions()}

            <SortDropdown className="mlauto" />
        </Toolbar>
    );
};

export default DriveToolbar;
