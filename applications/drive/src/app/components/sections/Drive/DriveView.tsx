import { Toolbar, PrivateMainArea } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import { useFolderView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import { mapDecryptedLinksToChildren } from '../helpers';
import DriveToolbar from './DriveToolbar';
import Drive from './Drive';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

function DriveView() {
    const { activeFolder } = useActiveShare();

    const folderView = useFolderView(activeFolder);
    const selectedItems = mapDecryptedLinksToChildren(folderView.selectionControls.selectedItems);

    return (
        <UploadDragDrop className="flex flex-column flex-nowrap flex-item-fluid">
            {activeFolder ? <DriveToolbar shareId={activeFolder.shareId} selectedItems={selectedItems} /> : <Toolbar />}
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="max-w100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom section--header">
                    {activeFolder && <DriveBreadcrumbs activeFolder={activeFolder} />}
                </div>
                {activeFolder && <Drive activeFolder={activeFolder} folderView={folderView} />}
            </PrivateMainArea>
        </UploadDragDrop>
    );
}

export default DriveView;
