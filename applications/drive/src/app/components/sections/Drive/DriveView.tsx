import { useEffect } from 'react';

import { PrivateMainArea, Toolbar } from '@proton/components';
import { LinkURLType, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import useNavigate from '../../../hooks/drive/useNavigate';
import { useFolderView } from '../../../store';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import { FileBrowserStateProvider } from '../../FileBrowser';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
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

    return (
        <FileBrowserStateProvider itemIds={folderView.items.map(({ linkId }) => linkId)}>
            <UploadDragDrop className="flex flex-column flex-nowrap flex-item-fluid">
                {activeFolder ? (
                    <DriveToolbar
                        isLinkReadOnly={folderView.isActiveLinkReadOnly}
                        shareId={activeFolder.shareId}
                        linkId={activeFolder.linkId}
                        items={folderView.items}
                    />
                ) : (
                    <Toolbar />
                )}
                <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                    <div className="max-w100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom section--header">
                        {activeFolder && <DriveBreadcrumbs activeFolder={activeFolder} />}
                    </div>
                    {activeFolder && <Drive activeFolder={activeFolder} folderView={folderView} />}
                </PrivateMainArea>
            </UploadDragDrop>
        </FileBrowserStateProvider>
    );
}

export default DriveView;
