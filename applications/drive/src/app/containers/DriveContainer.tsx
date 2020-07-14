import React, { useEffect, useState, useMemo } from 'react';
import { RouteComponentProps } from 'react-router';
import { Toolbar, PrivateMainArea, useAppTitle } from 'react-components';
import { c } from 'ttag';
import Drive from '../components/Drive/Drive';
import { useDriveActiveFolder } from '../components/Drive/DriveFolderProvider';
import DriveContentProvider from '../components/Drive/DriveContentProvider';
import DriveToolbar from '../components/Drive/DriveToolbar';
import { LinkType } from '../interfaces/link';
import { LinkURLType } from '../constants';
import DriveBreadcrumbs from '../components/DriveBreadcrumbs';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';

const toLinkURLType = (type: LinkType) => {
    const linkType = {
        [LinkType.FILE]: LinkURLType.FILE,
        [LinkType.FOLDER]: LinkURLType.FOLDER,
    }[type];

    if (!linkType) {
        throw new Error(`Type ${type} is unexpected, must be integer representing link type`);
    }

    return linkType;
};

function DriveContainer({
    match,
    history,
}: RouteComponentProps<{ shareId?: string; type?: LinkURLType; linkId?: string }>) {
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
        }
    }, [match.params]);

    useEffect(() => {
        if (folder) {
            setFolder(folder);
        }
    }, [folder]);

    const navigateToLink = (shareId: string, linkId: string, type: LinkType) => {
        history.push(`/drive/${shareId}/${toLinkURLType(type)}/${linkId}`);
    };

    useAppTitle(c('Title').t`My files`, 'ProtonDrive');

    // TODO: change toolbar props to optional children in react-components
    return (
        <DriveContentProvider folder={folder}>
            {folder ? <DriveToolbar activeFolder={folder} openLink={navigateToLink} /> : <Toolbar>{null}</Toolbar>}

            <PrivateMainArea hasToolbar className="flex flex-column">
                <div className="mw100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom">
                    {folder && <DriveBreadcrumbs activeFolder={folder} openLink={navigateToLink} />}
                </div>

                {folder && <Drive activeFolder={folder} openLink={navigateToLink} />}
            </PrivateMainArea>
        </DriveContentProvider>
    );
}

export default DriveContainer;
