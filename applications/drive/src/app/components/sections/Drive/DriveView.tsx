import { useEffect, useState, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';

import { Toolbar, PrivateMainArea, useAppTitle } from '@proton/components';

import { LinkURLType } from '../../../constants';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import DriveBreadcrumbs from '../../DriveBreadcrumbs';
import useNavigate from '../../../hooks/drive/useNavigate';
import DriveContentProvider from './DriveContentProvider';
import DriveToolbar from './DriveToolbar';
import Drive from './Drive';

function DriveView({ match }: RouteComponentProps<{ shareId?: string; type?: LinkURLType; linkId?: string }>) {
    const lastFolderRef = useRef<{
        shareId: string;
        linkId: string;
    }>();
    const cache = useDriveCache();
    const [, setError] = useState();
    const { setFolder } = useActiveShare();
    const { navigateToRoot } = useNavigate();

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
        } else if (type !== LinkURLType.FILE) {
            navigateToRoot();
        }
    }, [folder, match.params]);

    useAppTitle(c('Title').t`My files`);

    return (
        <DriveContentProvider folder={folder}>
            {folder ? <DriveToolbar activeFolder={folder} /> : <Toolbar />}
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="max-w100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom">
                    {folder && <DriveBreadcrumbs activeFolder={folder} />}
                </div>
                {folder && <Drive activeFolder={folder} />}
            </PrivateMainArea>
        </DriveContentProvider>
    );
}

export default DriveView;
