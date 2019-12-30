import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';
import Drive from '../components/Drive';
import useDrive from '../hooks/useDrive';
import { LinkType } from '../interfaces/folder';
import Page from '../components/Page';
import StickyHeader from '../components/StickyHeader';
import { DriveResource, useDriveResource } from '../components/DriveResourceProvider';

const toLinkType = (type: string) => {
    if (type === 'folder') {
        return LinkType.FOLDER;
    }
    if (type === 'file') {
        return LinkType.FILE;
    }
    throw new Error(`Type ${type} is unexpected, must be file or folder`);
};

const toResource = (shareId?: string, type?: string, linkId?: string): DriveResource | undefined => {
    if (shareId && type && linkId) {
        return { shareId, type: toLinkType(type), linkId };
    } else if (!shareId && !type && !linkId) {
        return undefined;
    }
    throw Error('Missing parameters, should be none or shareId/type/linkId');
};

function DriveContainer({ match, history }: RouteComponentProps<{ shareId?: string; linkId?: string; type?: string }>) {
    const { loadDrive } = useDrive();
    const [, setError] = useState();
    const { resource, setResource } = useDriveResource();

    const navigateToResource = (resource: DriveResource) => {
        history.push(`/drive/${resource.shareId}/folder/${resource.linkId}`);
    };

    useEffect(() => {
        const { shareId, type, linkId } = match.params;

        const initDrive = async () => {
            const initialResource = toResource(shareId, type, linkId);

            if (initialResource) {
                setResource(initialResource);
            } else {
                const initResult = await loadDrive();

                if (!initResult) {
                    throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
                }

                const { Share } = initResult;
                setResource({ shareId: Share.ShareID, linkId: Share.LinkID, type: LinkType.FOLDER });
            }
        };

        initDrive().catch((error) =>
            setError(() => {
                throw error;
            })
        );
    }, [match.params]);

    return (
        <Page title={c('Title').t`My files`} className="flex flex-column">
            <StickyHeader>
                <h3 className="mb0">{c('Title').t`My files`}</h3>
            </StickyHeader>
            {resource && <Drive resource={resource} openResource={navigateToResource} />}
        </Page>
    );
}

export default DriveContainer;
