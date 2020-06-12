import React, { useEffect } from 'react';

import { ToolbarSeparator, Toolbar } from 'react-components';

import useDrive from '../../hooks/drive/useDrive';
import { useDriveContent } from './DriveContentProvider';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { DriveFolder } from './DriveFolderProvider';
import { LinkType } from '../../interfaces/link';
import { isPreviewAvailable } from '../FilePreview/FilePreview';
import {
    PreviewButton,
    SortDropdown,
    DownloadButton,
    RenameButton,
    DetailsButton,
    MoveToTrashButton,
    MoveToFolderButton,
    BackButton,
    CreateNewFolderButton
} from './ToolbarButtons';

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const DriveToolbar = ({ activeFolder, openLink }: Props) => {
    const { fileBrowserControls } = useDriveContent();
    const { getLinkMeta } = useDrive();
    const cache = useDriveCache();

    const { linkId, shareId } = activeFolder;

    const ParentLinkID = cache.get.linkMeta(shareId, linkId)?.ParentLinkID;
    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        if (!ParentLinkID) {
            getLinkMeta(shareId, linkId);
        }
    }, [shareId, linkId, ParentLinkID]);

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return <CreateNewFolderButton activeFolder={activeFolder} />;
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
                <PreviewButton shareId={shareId} disabled={isPreviewDisabled} openLink={openLink} />
                <DownloadButton shareId={shareId} />
                <RenameButton shareId={shareId} disabled={isMultiSelect} />
                <DetailsButton activeFolder={activeFolder} disabled={isMultiSelect} />

                <ToolbarSeparator />

                <MoveToTrashButton activeFolder={activeFolder} />
                <MoveToFolderButton activeFolder={activeFolder} />
            </>
        );
    };

    return (
        <Toolbar>
            <BackButton shareId={shareId} parentLinkId={ParentLinkID} disabled={!ParentLinkID} openLink={openLink} />

            <ToolbarSeparator />

            {renderSelectionActions()}
            <SortDropdown className="mlauto" />
        </Toolbar>
    );
};

export default DriveToolbar;
