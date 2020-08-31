import React, { useEffect, useState, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';

import { Toolbar, PrivateMainArea, useAppTitle } from 'react-components';

import { useDriveActiveFolder } from '../../components/Drive/DriveFolderProvider';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import Drive from '../../components/Drive/Drive';
import DriveContentProvider from '../../components/Drive/DriveContentProvider';
import DriveToolbar from '../../components/Drive/DriveToolbar';
import DriveBreadcrumbs from '../../components/DriveBreadcrumbs';
import { LinkURLType } from '../../constants';

function DriveContainerView({ match }: RouteComponentProps<{ shareId?: string; type?: LinkURLType; linkId?: string }>) {
    const lastFolderRef = useRef<{
        shareId: string;
        linkId: string;
    }>();
    const cache = useDriveCache();
    const [, setError] = useState();
    const { setFolder } = useDriveActiveFolder();

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
            setError(() => {
                throw new Error('Missing parameters, should be none or shareId/type/linkId');
            });
        } else if (type === LinkURLType.FOLDER) {
            return { shareId, linkId };
        } else {
            return lastFolderRef.current;
        }
    }, [match.params]);

    // In case we open preview, folder doesn't need to change
    lastFolderRef.current = folder;

    useEffect(() => {
        if (folder) {
            setFolder(folder);
        }
    }, [folder]);

    useAppTitle(c('Title').t`My files`);

    return (
        <DriveContentProvider folder={folder}>
            {folder ? <DriveToolbar activeFolder={folder} /> : <Toolbar />}
            <PrivateMainArea hasToolbar className="flex-noMinChildren flex-column flex-nowrap">
                <div className="mw100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom">
                    {folder && <DriveBreadcrumbs activeFolder={folder} />}
                </div>
                {folder && <Drive activeFolder={folder} />}
            </PrivateMainArea>
        </DriveContentProvider>
    );
}

export default DriveContainerView;
