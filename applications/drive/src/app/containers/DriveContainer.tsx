import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';
import Drive from '../components/Drive/Drive';
import useDrive from '../hooks/useDrive';
import Page, { PageMainArea } from '../components/Page';
import StickyHeader from '../components/StickyHeader';
import { DriveResource, useDriveResource } from '../components/Drive/DriveResourceProvider';
import DriveContentProvider from '../components/Drive/DriveContentProvider';
import DriveToolbar from '../components/Drive/DriveToolbar';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';
import { LinkMeta, ResourceType } from '../interfaces/link';
import { ResourceURLType } from '../constants';
import DriveBreadcrumbs from '../components/DriveBreadcrumbs';

const toResourceType = (type: ResourceURLType) => {
    const resourceType = {
        [ResourceURLType.FILE]: ResourceType.FILE,
        [ResourceURLType.FOLDER]: ResourceType.FOLDER
    }[type];

    if (!resourceType) {
        throw new Error(`Type ${type} is unexpected, must be file or folder`);
    }

    return resourceType;
};

const toLinkType = (type: ResourceType) => {
    const linkType = {
        [ResourceType.FILE]: ResourceURLType.FILE,
        [ResourceType.FOLDER]: ResourceURLType.FOLDER
    }[type];

    if (!linkType) {
        throw new Error(`Type ${type} is unexpected, must be integer representing resource type`);
    }

    return linkType;
};

const toResource = (shareId?: string, type?: ResourceURLType, linkId?: string): DriveResource | undefined => {
    if (shareId && type && linkId) {
        return { shareId, type: toResourceType(type), linkId };
    } else if (!shareId && !type && !linkId) {
        return undefined;
    }
    throw Error('Missing parameters, should be none or shareId/type/linkId');
};

interface DriveHistoryState {
    preloadedLink?: FileBrowserItem | LinkMeta;
}

function DriveContainer({
    match,
    history,
    location
}: RouteComponentProps<
    { shareId?: string; type?: ResourceURLType; linkId?: string },
    {},
    DriveHistoryState | undefined
>) {
    const { loadDrive } = useDrive();
    const { resource, setResource } = useDriveResource();
    const [, setError] = useState();

    const navigateToResource = (resource: DriveResource, item?: FileBrowserItem) => {
        history.push(`/drive/${resource.shareId}/${toLinkType(resource.type)}/${resource.linkId}`, {
            preloadedLink: item
        });
    };

    useEffect(() => {
        const { shareId, type, linkId } = match.params;

        const initDrive = async () => {
            const initialResource = toResource(shareId, type, linkId);

            if (type === ResourceURLType.FOLDER && initialResource) {
                setResource(initialResource);
            } else if (!initialResource) {
                const initResult = await loadDrive();

                if (!initResult) {
                    throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
                }

                const { Share } = initResult;
                setResource({ shareId: Share.ShareID, linkId: Share.LinkID, type: ResourceType.FOLDER });
            }
        };

        initDrive().catch((error) =>
            setError(() => {
                throw error;
            })
        );
    }, [match.params]);

    return (
        <Page title={c('Title').t`My files`}>
            <DriveContentProvider>
                {resource && (
                    <DriveToolbar
                        resource={resource}
                        openResource={navigateToResource}
                        parentLinkID={location.state?.preloadedLink?.ParentLinkID}
                    />
                )}
                <PageMainArea hasToolbar className="flex flex-column">
                    <StickyHeader>
                        {resource && (
                            <DriveBreadcrumbs
                                openResource={navigateToResource}
                                preloaded={location.state?.preloadedLink}
                                resource={resource}
                            />
                        )}
                    </StickyHeader>

                    {resource && <Drive resource={resource} openResource={navigateToResource} />}
                </PageMainArea>
            </DriveContentProvider>
        </Page>
    );
}

export default DriveContainer;
