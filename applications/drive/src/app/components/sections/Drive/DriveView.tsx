import { Toolbar, PrivateMainArea } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import { useFolderView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import DriveToolbar from './DriveToolbar';
import Drive from './Drive';
import { FileBrowserStateProvider } from '../../FileBrowser';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

function DriveView() {
    const { activeFolder } = useActiveShare();

    const folderView = useFolderView(activeFolder);

    return (
        <FileBrowserStateProvider itemIds={folderView.items.map(({ linkId }) => linkId)}>
            <UploadDragDrop className="flex flex-column flex-nowrap flex-item-fluid">
                {activeFolder ? <DriveToolbar shareId={activeFolder.shareId} items={folderView.items} /> : <Toolbar />}
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
