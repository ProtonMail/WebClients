import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { getDevice } from '@proton/shared/lib/helpers/browser';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { type DecryptedLink, useActions } from '../../../store';
import { useSelection } from '../../FileBrowser';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    OpenInDocsButton,
    PreviewButton,
    RenameButton,
    ShareButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { getSelectedItems } from '../helpers';
import useIsEditEnabled from '../useIsEditEnabled';
import {
    ActionsDropdown,
    CreateNewFileButton,
    CreateNewFolderButton,
    MoveToFolderButton,
    MoveToTrashButton,
    UploadFileButton,
    UploadFolderButton,
} from './ToolbarButtons';

interface Props {
    shareId: string;
    linkId: string;
    items: DecryptedLink[];
    permissions: SHARE_MEMBER_PERMISSIONS;
    showOptionsForNoSelection?: boolean;
    isLinkReadOnly?: boolean;
}

const DriveToolbar = ({ shareId, items, showOptionsForNoSelection = true, isLinkReadOnly, permissions }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { viewportWidth } = useActiveBreakpoint();
    const selectionControls = useSelection()!;
    const isEditEnabled = useIsEditEnabled();
    const { createFolder, trashLinks, renameLink } = useActions();
    const { activeFolder } = useActiveShare();

    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const shouldShowShareButton = !isLinkReadOnly || items.length > 0;

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    {isEditor && !isLinkReadOnly ? (
                        <>
                            <CreateNewFolderButton createFolder={createFolder} activeFolder={activeFolder} />
                            {isEditEnabled && <CreateNewFileButton />}
                            <Vr />
                            {isDesktop && <UploadFolderButton />}
                            <UploadFileButton />
                            <Vr />
                        </>
                    ) : null}

                    {isAdmin && shouldShowShareButton && <ShareButton shareId={shareId} />}
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedBrowserItems={selectedItems} />
                <OpenInDocsButton selectedBrowserItems={selectedItems} />
                <DownloadButton selectedBrowserItems={selectedItems} />
                {viewportWidth['<=small'] ? (
                    <ActionsDropdown
                        shareId={shareId}
                        selectedLinks={selectedItems}
                        permissions={permissions}
                        renameLink={renameLink}
                        trashLinks={trashLinks}
                    />
                ) : (
                    <>
                        {isAdmin && (
                            <>
                                <ShareLinkButton selectedLinks={selectedItems} />
                                <Vr />
                            </>
                        )}
                        {isEditor && !isLinkReadOnly ? (
                            <>
                                <MoveToFolderButton shareId={shareId} selectedLinks={selectedItems} />
                                <RenameButton selectedLinks={selectedItems} renameLink={renameLink} />
                            </>
                        ) : null}
                        <DetailsButton selectedBrowserItems={selectedItems} />

                        {isEditor && (
                            <>
                                <Vr />
                                <MoveToTrashButton selectedLinks={selectedItems} trashLinks={trashLinks} />
                            </>
                        )}
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                {selectedItems.length > 0 && <Vr className="hidden md:flex mx-2" />}
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;
