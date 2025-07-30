import { useEffect } from 'react';

import { Toolbar } from '@proton/components';
import { MemberRole, generateNodeUid } from '@proton/drive/index';
import type { LinkURLType } from '@proton/shared/lib/drive/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import DriveBreadcrumbs from '../../components/DriveBreadcrumbs';
import { FileBrowserStateProvider } from '../../components/FileBrowser';
import { useAlbumOnboardingModal } from '../../components/modals/AlbumOnboardingModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import useDriveNavigation from '../../hooks/drive/useNavigate';
import { FolderBrowser } from './FolderBrowser/FolderBrowser';
import { FolderToolbar } from './FolderBrowser/FolderToolbar';
import { useFolder } from './useFolder';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

export function FolderView() {
    const { navigateToRoot, navigateToLink } = useDriveNavigation();
    const [renderAlbumOnboardingModal] = useAlbumOnboardingModal();
    const { activeFolder } = useActiveShare();
    const parentUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);
    const folderView = useFolder(parentUid, activeFolder.shareId);
    const isEditor = folderView.role === MemberRole.Editor;
    useEffect(() => {
        if (folderView.error) {
            // TODO:WIP maybe move it inside the hook
            const code = RESPONSE_CODE.INVALID_LINK_TYPE; //folderView.error.data?.Code;
            if (code === RESPONSE_CODE.INVALID_LINK_TYPE) {
                navigateToLink(activeFolder.shareId, activeFolder.linkId, true);
            } else if (code === RESPONSE_CODE.NOT_FOUND || code === RESPONSE_CODE.INVALID_ID) {
                navigateToRoot();
            } else {
                throw folderView.error;
            }
        }
    }, [folderView.error]);

    const breadcrumbs = activeFolder && <DriveBreadcrumbs activeFolder={activeFolder} />;

    const toolbar = activeFolder ? (
        <FolderToolbar
            role={folderView.role}
            isLinkReadOnly={folderView.isActiveLinkReadOnly}
            isLinkRoot={folderView.isActiveLinkRoot}
            isLinkInDeviceShare={folderView.isActiveLinkInDeviceShare}
            volumeId={activeFolder.volumeId}
            shareId={activeFolder.shareId}
            linkId={activeFolder.linkId}
            items={folderView.legacyItems}
        />
    ) : (
        <Toolbar className="toolbar--in-container" />
    );

    return (
        <FileBrowserStateProvider itemIds={folderView.legacyItems.map(({ uid }) => uid)}>
            {renderAlbumOnboardingModal}
            {isEditor ? (
                <UploadDragDrop
                    shareId={activeFolder.shareId}
                    parentLinkId={activeFolder.linkId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={folderView.isActiveLinkReadOnly}
                >
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />

                    {activeFolder && <FolderBrowser activeFolder={activeFolder} folderView={folderView} />}
                </UploadDragDrop>
            ) : (
                <>
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    {activeFolder && <FolderBrowser activeFolder={activeFolder} folderView={folderView} />}
                </>
            )}
        </FileBrowserStateProvider>
    );
}
