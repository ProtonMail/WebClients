import { useEffect, useState, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';

import { Toolbar, PrivateMainArea, useAppTitle } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import useNavigate from '../../../hooks/drive/useNavigate';
import DriveContentProvider from './DriveContentProvider';
import DriveToolbar from './DriveToolbar';
import Drive from './Drive';
import useDriveEvents from '../../../hooks/drive/useDriveEvents';
import useDrive from '../../../hooks/drive/useDrive';

import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

function DriveView({ match }: RouteComponentProps<DriveSectionRouteProps>) {
    const lastFolderRef = useRef<{
        shareId: string;
        linkId: string;
    }>();
    const cache = useDriveCache();
    const [, setError] = useState();
    const { setFolder } = useActiveShare();
    const { navigateToRoot } = useNavigate();
    const driveEvents = useDriveEvents();
    const { handleDriveEvents } = useDrive();

    const folder = useMemo(() => {
        const { shareId, type, linkId } = match.params;

        if (!shareId && !type && !linkId) {
            const meta = cache.get.defaultShareMeta();

            if (meta) {
                return { shareId: meta.ShareID, linkId: meta.LinkID };
            }
            setError(() => {
                throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
            });
        } else if (!shareId || !type || !linkId) {
            console.error('Missing parameters, should be none or shareId/type/linkId');
            navigateToRoot();
        } else if (type === LinkURLType.FOLDER) {
            return { shareId, linkId };
        }
        return lastFolderRef.current;
    }, [match.params]);

    // In case we open preview, folder doesn't need to change
    lastFolderRef.current = folder;

    useEffect(() => {
        const { type } = match.params;

        if (folder) {
            setFolder(folder);
            const { shareId } = match.params;
            if (!shareId) {
                return;
            }
            void driveEvents.listenForShareEvents(shareId, handleDriveEvents(shareId));
        } else if (type !== LinkURLType.FILE) {
            navigateToRoot();
        }
    }, [folder, match.params]);

    useAppTitle(c('Title').t`My files`);

    return (
        <UploadDragDrop className="flex flex-column flex-nowrap flex-item-fluid">
            <DriveContentProvider folder={folder}>
                {folder ? <DriveToolbar activeFolder={folder} /> : <Toolbar />}
                <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                    <div className="max-w100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom section--header">
                        {folder && <DriveBreadcrumbs activeFolder={folder} />}
                    </div>
                    {folder && <Drive activeFolder={folder} />}
                </PrivateMainArea>
            </DriveContentProvider>
        </UploadDragDrop>
    );
}

export default DriveView;
