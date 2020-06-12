import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import { DriveFolder } from '../DriveFolderProvider';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import CreateFolderModal from '../../CreateFolderModal';
import MoveToFolderModal from '../../MoveToFolderModal';
import useDrive from '../../../hooks/drive/useDrive';
import useListNotifications from '../../../hooks/util/useListNotifications';

interface Props {
    activeFolder: DriveFolder;
    disabled?: boolean;
    className?: string;
}

const MoveToFolderButton = ({ activeFolder, disabled, className }: Props) => {
    const { createModal } = useModals();
    const { createMoveLinksNotifications } = useListNotifications();
    const { createNewFolder, getShareMeta, getLinkMeta, getFoldersOnlyMetas, moveLinks, events } = useDrive();
    const { fileBrowserControls } = useDriveContent();
    const cache = useDriveCache();

    const { selectedItems } = fileBrowserControls;
    const { linkId, shareId } = activeFolder;

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

    const moveToFolder = () => {
        if (!selectedItems.length) {
            return;
        }

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
                    const result = await moveLinks(
                        shareId,
                        parentFolderId,
                        toMove.map(({ LinkID }) => LinkID)
                    );

                    createMoveLinksNotifications(toMove, result);

                    await events.call(shareId);
                }}
                openCreateFolderModal={handleCreateFolder}
            />
        );
    };

    return (
        <ToolbarButton
            disabled={disabled}
            className={className}
            title={c('Action').t`Move to Folder`}
            icon="arrow-cross"
            onClick={() => moveToFolder()}
        />
    );
};

export default MoveToFolderButton;
