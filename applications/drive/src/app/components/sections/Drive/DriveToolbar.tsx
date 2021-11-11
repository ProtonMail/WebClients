import { useEffect } from 'react';

import { getDevice } from '@proton/shared/lib/helpers/browser';
import { ToolbarSeparator, Toolbar, useActiveBreakpoint } from '@proton/components';

import useDrive from '../../../hooks/drive/useDrive';
import { useDriveContent } from './DriveContentProvider';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { DriveFolder } from '../../../hooks/drive/useActiveShare';
import {
    DetailsButton,
    DownloadButton,
    LayoutDropdown,
    PreviewButton,
    RenameButton,
    ShareButton,
    ShareFileButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import {
    ActionsDropdown,
    CreateNewFolderButton,
    MoveToTrashButton,
    MoveToFolderButton,
    UploadFileButton,
    UploadFolderButton,
} from './ToolbarButtons';

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

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} />
                ) : (
                    <>
                        <ShareButton shareId={shareId} selectedItems={selectedItems} />
                        <ShareLinkButton shareId={shareId} selectedItems={selectedItems} />
                        <ToolbarSeparator />
                        <MoveToFolderButton sourceFolder={activeFolder} selectedItems={selectedItems} />
                        <RenameButton shareId={shareId} selectedItems={selectedItems} />
                        <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                        <ToolbarSeparator />
                        <MoveToTrashButton sourceFolder={activeFolder} selectedItems={selectedItems} />
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="mlauto flex flex-nowrap">
                <LayoutDropdown />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;
