import { c } from 'ttag';

import { Toolbar, PrivateMainArea, useAppTitle } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import DriveContentProvider from './DriveContentProvider';
import DriveToolbar from './DriveToolbar';
import Drive from './Drive';
import useActiveShare from '../../../hooks/drive/useActiveShare';

import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

function DriveView() {
    const { activeFolder } = useActiveShare();
    useAppTitle(c('Title').t`My files`);

    return (
        <UploadDragDrop className="flex flex-column flex-nowrap flex-item-fluid">
            <DriveContentProvider>
                {activeFolder ? <DriveToolbar activeFolder={activeFolder} /> : <Toolbar />}
                <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                    <div className="max-w100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom section--header">
                        {activeFolder && <DriveBreadcrumbs activeFolder={activeFolder} />}
                    </div>
                    {activeFolder && <Drive activeFolder={activeFolder} />}
                </PrivateMainArea>
            </DriveContentProvider>
        </UploadDragDrop>
    );
}

export default DriveView;
