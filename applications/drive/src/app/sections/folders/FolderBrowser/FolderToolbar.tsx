import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import { getDevice } from '@proton/shared/lib/helpers/browser';

import { useSelection } from '../../../components/FileBrowser';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    OpenInDocsButton,
    PreviewButton,
    ShareButton,
    ShareLinkButton,
} from '../../../components/sections/ToolbarButtons';
import useIsEditEnabled from '../../../components/sections/useIsEditEnabled';
import { useDocumentActions } from '../../../store';
import {
    ActionsDropdown,
    CreateNewFileButton,
    CreateNewFolderButton,
    MoveToFolderButton,
    MoveToTrashButton,
    RenameButton,
    UploadFileButton,
    UploadFolderButton,
} from '../ToolbarButtons';
import { CreateNewDocumentButton } from '../ToolbarButtons/CreateNewDocumentButton';
import { CreateNewSheetButton } from '../ToolbarButtons/CreateNewSheetButton';
import { getSelectedItems } from '../getSelectedItems';
import { useFolderStore } from '../useFolder.store';

interface Props {
    volumeId: string;
    shareId: string;
    linkId: string;
    showOptionsForNoSelection?: boolean;
}

export const FolderToolbar = ({ volumeId, shareId, linkId, showOptionsForNoSelection = true }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { viewportWidth } = useActiveBreakpoint();
    const selectionControls = useSelection();
    const isEditEnabled = useIsEditEnabled();
    const { createDocument } = useDocumentActions();
    const { items, permissions, role } = useFolderStore(
        useShallow((state) => ({
            folder: state.folder,
            permissions: state.permissions,
            items: state.getFolderItems(),
            role: state.role,
        }))
    );

    const isAdmin = role === MemberRole.Admin;

    const selectedItems = getSelectedItems(items, selectionControls?.selectedItemIds || []);

    const shouldShowShareButton = permissions.canShare && selectedItems.length === 0 && items.length > 0;
    const shouldShowShareLinkButton = isAdmin && (selectedItems.length > 0 || permissions.canShareNode);

    const selectedItem = selectedItems.length === 1 ? selectedItems[0] : undefined;

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    {permissions.canCreateNode ? (
                        <>
                            <CreateNewFolderButton activeFolder={{ volumeId, shareId, linkId }} />
                            {isEditEnabled && <CreateNewFileButton />}
                            {permissions.canCreateDocs && (
                                <CreateNewDocumentButton
                                    onClick={() => createDocument({ type: 'doc', shareId, parentLinkId: linkId })}
                                />
                            )}
                            {permissions.canCreateSheets && (
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
                    {shouldShowShareLinkButton && (
                        <ShareLinkButton volumeId={volumeId} shareId={shareId} linkId={linkId} />
                    )}
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedBrowserItems={selectedItems} />
                <OpenInDocsButton selectedBrowserItems={selectedItems} />
                <DownloadButton selectedBrowserItems={selectedItems} />
                {viewportWidth['<=small'] ? (
                    <ActionsDropdown volumeId={volumeId} shareId={shareId} selectedItems={selectedItems} role={role} />
                ) : (
                    <>
                        {shouldShowShareLinkButton && selectedItem && (
                            <>
                                <ShareLinkButton
                                    volumeId={selectedItem.volumeId}
                                    shareId={selectedItem.rootShareId}
                                    linkId={selectedItem.linkId}
                                />
                                <Vr />
                            </>
                        )}

                        {permissions.canMove && <MoveToFolderButton shareId={shareId} selectedItems={selectedItems} />}
                        {permissions.canRename && <RenameButton selectedItems={selectedItems} />}
                        <DetailsButton selectedBrowserItems={selectedItems} />

                        {permissions.canEdit && (
                            <>
                                <Vr />
                                <MoveToTrashButton selectedItems={selectedItems} />
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
