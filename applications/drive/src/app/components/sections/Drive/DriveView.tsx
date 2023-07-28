import { useEffect } from 'react';

import { Toolbar } from '@proton/components';
import { LinkURLType, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import useNavigate from '../../../hooks/drive/useNavigate';
import { useFolderView } from '../../../store';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import { FileBrowserStateProvider } from '../../FileBrowser';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import Drive from './Drive';
import DriveToolbar from './DriveToolbar';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

function DriveView() {
    const { activeFolder } = useActiveShare();
    const { navigateToRoot, navigateToLink } = useNavigate();

    const folderView = useFolderView(activeFolder);

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
            isLinkReadOnly={folderView.isActiveLinkReadOnly}
            shareId={activeFolder.shareId}
            linkId={activeFolder.linkId}
            items={folderView.items}
        />
    ) : (
        <Toolbar className="toolbar--in-container" />
    );

    return (
        <FileBrowserStateProvider itemIds={folderView.items.map(({ linkId }) => linkId)}>
            <UploadDragDrop
                shareId={activeFolder.shareId}
                linkId={activeFolder.linkId}
                className="flex flex-column flex-nowrap flex-item-fluid"
                disabled={folderView.isActiveLinkReadOnly}
            >
                <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                {activeFolder && <Drive activeFolder={activeFolder} folderView={folderView} />}
            </UploadDragDrop>
        </FileBrowserStateProvider>
    );
}

export default DriveView;
