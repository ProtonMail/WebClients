import React, { useEffect, useState, useMemo } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';
import { Toolbar } from 'react-components';
import Drive from '../components/Drive/Drive';
import Page, { PageMainArea } from '../components/Page';
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
        [LinkType.FOLDER]: LinkURLType.FOLDER
    }[type];

    if (!linkType) {
        throw new Error(`Type ${type} is unexpected, must be integer representing link type`);
    }

    return linkType;
};

function DriveContainer({
    match,
    history
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
            } else {
                setError(() => {
                    throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
                });
            }
        } else if (!shareId || !type || !linkId) {
            setError(() => {
                throw new Error('Missing parameters, should be none or shareId/type/linkId');
            });
        } else if (type === LinkURLType.FOLDER) {
            return { shareId, linkId };
        }
    }, [match.params]);

    useEffect(() => {
        setFolder(folder);
    }, [folder]);

    const navigateToLink = (shareId: string, linkId: string, type: LinkType) => {
        history.push(`/drive/${shareId}/${toLinkURLType(type)}/${linkId}`);
    };

    // TODO: change toolbar props to optional children in react-components
    return (
        <Page title={c('Title').t`My files`}>
            <DriveContentProvider folder={folder}>
                {folder ? <DriveToolbar activeFolder={folder} openLink={navigateToLink} /> : <Toolbar>{null}</Toolbar>}
                <PageMainArea hasToolbar className="flex flex-column flex-nowrap">
                    <div className="pt0-5 pb0-5 pl0-75 pr0-75 border-bottom">
                        {folder && <DriveBreadcrumbs activeFolder={folder} openLink={navigateToLink} />}
                    </div>

                    {folder && <Drive activeFolder={folder} openLink={navigateToLink} />}
                </PageMainArea>
            </DriveContentProvider>
        </Page>
    );
}

export default DriveContainer;
