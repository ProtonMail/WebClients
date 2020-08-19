import React, { useEffect } from 'react';

import { ToolbarSeparator, Toolbar, isPreviewAvailable } from 'react-components';

import { getDevice } from 'proton-shared/lib/helpers/browser';
import useDrive from '../../hooks/drive/useDrive';
import { useDriveContent } from './DriveContentProvider';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { DriveFolder } from './DriveFolderProvider';
import { LinkType } from '../../interfaces/link';
import {
    PreviewButton,
    SortDropdown,
    DownloadButton,
    RenameButton,
    DetailsButton,
    MoveToTrashButton,
    MoveToFolderButton,
    BackButton,
    CreateNewFolderButton,
} from './ToolbarButtons';
import UploadFolderButton from './ToolbarButtons/UploadFolderButton';

interface Props {
    activeFolder: DriveFolder;
}

const DriveToolbar = ({ activeFolder }: Props) => {
    const { fileBrowserControls } = useDriveContent();
    const { getLinkMeta } = useDrive();
    const cache = useDriveCache();
    const isDesktop = !getDevice()?.type;

    const { linkId, shareId } = activeFolder;

    const ParentLinkID = cache.get.linkMeta(shareId, linkId)?.ParentLinkID;
    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        if (!ParentLinkID) {
            getLinkMeta(shareId, linkId).catch(console.error);
        }
    }, [shareId, linkId, ParentLinkID]);

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return (
                <>
                    <CreateNewFolderButton />
                    {isDesktop && (
                        <>
                            <ToolbarSeparator />
                            <UploadFolderButton />
                        </>
                    )}
                </>
            );
        }

        const isMultiSelect = selectedItems.length > 1;
        const hasFoldersSelected = selectedItems.some((item) => item.Type === LinkType.FOLDER);
        const isPreviewDisabled =
            isMultiSelect ||
            hasFoldersSelected ||
            !selectedItems[0].MIMEType ||
            !isPreviewAvailable(selectedItems[0].MIMEType);

        return (
            <>
                <PreviewButton disabled={isPreviewDisabled} />
                <DownloadButton />
                <RenameButton disabled={isMultiSelect} />
                <DetailsButton disabled={isMultiSelect} />

                <ToolbarSeparator />

                <MoveToTrashButton />
                <MoveToFolderButton />
            </>
        );
    };

    return (
        <Toolbar>
            <BackButton shareId={shareId} parentLinkId={ParentLinkID} disabled={!ParentLinkID} />

            <ToolbarSeparator />

            {renderSelectionActions()}
            <span className="mlauto flex">
                <SortDropdown />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;
