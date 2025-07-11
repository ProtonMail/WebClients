import { useEffect, useMemo } from 'react';

import { Toolbar } from '@proton/components';
import type { LinkURLType } from '@proton/shared/lib/drive/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { getCanWrite } from '@proton/shared/lib/drive/permissions';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useFolderView } from '../../../store';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import { FileBrowserStateProvider } from '../../FileBrowser';
import { useAlbumOnboardingModal } from '../../modals/AlbumOnboardingModal';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import Drive from './Drive';
import DriveToolbar from './DriveToolbar';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

function DriveView() {
    const { activeFolder } = useActiveShare();
    const { navigateToRoot, navigateToLink } = useDriveNavigation();
    const [renderAlbumOnboardingModal] = useAlbumOnboardingModal();

    const folderView = useFolderView(activeFolder);
    const isEditor = useMemo(() => getCanWrite(folderView.permissions), [folderView.permissions]);

    useEffect(() => {
        if (folderView.error) {
            const code = folderView.error.data?.Code;
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
        <DriveToolbar
            permissions={folderView.permissions}
            isLinkReadOnly={folderView.isActiveLinkReadOnly}
            isLinkRoot={folderView.isActiveLinkRoot}
            isLinkInDeviceShare={folderView.isActiveLinkInDeviceShare}
            volumeId={activeFolder.volumeId}
            shareId={activeFolder.shareId}
            linkId={activeFolder.linkId}
            items={folderView.items}
        />
    ) : (
        <Toolbar className="toolbar--in-container" />
    );

    return (
        <FileBrowserStateProvider itemIds={folderView.items.map(({ linkId }) => linkId)}>
            {renderAlbumOnboardingModal}
            {isEditor ? (
                <UploadDragDrop
                    shareId={activeFolder.shareId}
                    parentLinkId={activeFolder.linkId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={folderView.isActiveLinkReadOnly}
                >
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />

                    {activeFolder && <Drive activeFolder={activeFolder} folderView={folderView} />}
                </UploadDragDrop>
            ) : (
                <>
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    {activeFolder && <Drive activeFolder={activeFolder} folderView={folderView} />}
                </>
            )}
        </FileBrowserStateProvider>
    );
}

export default DriveView;
