import { useMemo } from 'react';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { getDevice } from '@proton/shared/lib/helpers/browser';

import { type DecryptedLink, useActions, useDocumentActions } from '../../../store';
import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../../store/_documents';
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
import { CreateNewDocumentButton } from './ToolbarButtons/CreateNewDocumentButton';
import { CreateNewSheetButton } from './ToolbarButtons/CreateNewSheetButton';

interface Props {
    volumeId: string;
    shareId: string;
    linkId: string;
    items: DecryptedLink[];
    permissions: SHARE_MEMBER_PERMISSIONS;
    showOptionsForNoSelection?: boolean;
    isLinkReadOnly?: boolean;
    isLinkRoot?: boolean;
    isLinkInDeviceShare?: boolean;
}

const DriveToolbar = ({
    volumeId,
    shareId,
    linkId,
    items,
    showOptionsForNoSelection = true,
    isLinkReadOnly,
    isLinkRoot,
    isLinkInDeviceShare,
    permissions,
}: Props) => {
    const isDesktop = !getDevice()?.type;
    const { viewportWidth } = useActiveBreakpoint();
    const selectionControls = useSelection();
    const isEditEnabled = useIsEditEnabled();
    const { trashLinks, renameLink } = useActions();
    const { createDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();

    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls?.selectedItemIds || []),
        [items, selectionControls?.selectedItemIds]
    );

    const shouldShowShareButton =
        isAdmin && (isLinkReadOnly || isLinkRoot) && selectedItems.length === 0 && items.length > 0;
    const shouldShowShareLinkButton = isAdmin && (selectedItems.length > 0 || (!isLinkReadOnly && !isLinkRoot));

    const selectedItem = selectedItems.length === 1 ? selectedItems[0] : undefined;

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    {isEditor && !isLinkReadOnly ? (
                        <>
                            <CreateNewFolderButton activeFolder={{ volumeId, shareId, linkId }} />
                            {isEditEnabled && <CreateNewFileButton />}
                            {isDocsEnabled && !isLinkReadOnly && !isLinkInDeviceShare && (
                                <CreateNewDocumentButton
                                    onClick={() => createDocument({ type: 'doc', shareId, parentLinkId: linkId })}
                                />
                            )}
                            {isSheetsEnabled && !isLinkReadOnly && !isLinkInDeviceShare && (
                                <CreateNewSheetButton
                                    onClick={() => createDocument({ type: 'sheet', shareId, parentLinkId: linkId })}
                                />
                            )}
                            <Vr />
                            {isDesktop && <UploadFolderButton />}
                            <UploadFileButton />
                            <Vr />
                        </>
                    ) : null}

                    {shouldShowShareButton && <ShareButton shareId={shareId} />}
                    {shouldShowShareLinkButton && <ShareLinkButton volumeId={volumeId} linkId={linkId} />}
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
                        volumeId={volumeId}
                        shareId={shareId}
                        selectedLinks={selectedItems}
                        permissions={permissions}
                        renameLink={renameLink}
                        trashLinks={trashLinks}
                    />
                ) : (
                    <>
                        {shouldShowShareLinkButton && selectedItem && (
                            <>
                                <ShareLinkButton volumeId={selectedItem.volumeId} linkId={selectedItem.linkId} />
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
