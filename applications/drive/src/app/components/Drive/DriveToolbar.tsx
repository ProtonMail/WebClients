import React, { useEffect } from 'react';

import { getDevice } from 'proton-shared/lib/helpers/browser';
import { ToolbarSeparator, Toolbar, isPreviewAvailable, useActiveBreakpoint } from 'react-components';

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
import LayoutDropdown from './ToolbarButtons/LayoutDropdown';
import ActionsDropdown from './ToolbarButtons/ActionsDropdown';
import GetSecureLinkButton from './ToolbarButtons/GetSecureLinkButton';
import UploadFileButton from './ToolbarButtons/UploadFileButton';
import ShareFileButton from './ToolbarButtons/ShareFileButton';

interface Props {
    activeFolder: DriveFolder;
}

const DriveToolbar = ({ activeFolder }: Props) => {
    const { fileBrowserControls } = useDriveContent();
    const { getLinkMeta } = useDrive();
    const cache = useDriveCache();
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();

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
                            <UploadFileButton />
                        </>
                    )}
                    <ToolbarSeparator />
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        const isMultiSelect = selectedItems.length > 1;
        const hasFoldersSelected = selectedItems.some((item) => item.Type === LinkType.FOLDER);
        const isPreviewDisabled =
            isMultiSelect ||
            hasFoldersSelected ||
            !selectedItems[0]?.MIMEType ||
            !isPreviewAvailable(selectedItems[0].MIMEType);

        return (
            <>
                <PreviewButton disabled={isPreviewDisabled} />
                <DownloadButton disabled={!selectedItems.length} />
                <ToolbarSeparator />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} />
                ) : (
                    <>
                        <RenameButton disabled={isMultiSelect} />
                        <DetailsButton disabled={isMultiSelect && hasFoldersSelected} />
                        <ToolbarSeparator />
                        <MoveToTrashButton />
                        <MoveToFolderButton />
                        <GetSecureLinkButton shareId={shareId} disabled={isMultiSelect || hasFoldersSelected} />
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar>
            <BackButton shareId={shareId} parentLinkId={ParentLinkID} disabled={!ParentLinkID} />

            <ToolbarSeparator />

            {renderSelectionActions()}
            <span className="mlauto flex flex-nowrap">
                <LayoutDropdown />
                <SortDropdown />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;
