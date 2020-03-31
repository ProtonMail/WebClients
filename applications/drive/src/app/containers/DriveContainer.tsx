import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';
import { Toolbar } from 'react-components';
import Drive from '../components/Drive/Drive';
import Page, { PageMainArea } from '../components/Page';
import StickyHeader from '../components/StickyHeader';
import { DriveResource, useDriveResource } from '../components/Drive/DriveResourceProvider';
import DriveContentProvider from '../components/Drive/DriveContentProvider';
import DriveToolbar from '../components/Drive/DriveToolbar';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';
import { ResourceType } from '../interfaces/link';
import { ResourceURLType } from '../constants';
import DriveBreadcrumbs from '../components/DriveBreadcrumbs';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';

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

function DriveContainer({
    match,
    history
}: RouteComponentProps<{ shareId?: string; type?: ResourceURLType; linkId?: string }>) {
    const cache = useDriveCache();
    const { resource, setResource } = useDriveResource();

    const navigateToResource = (resource: DriveResource, item?: FileBrowserItem) => {
        history.push(`/drive/${resource.shareId}/${toLinkType(resource.type)}/${resource.linkId}`, {
            preloadedLink: item
        });
    };

    useEffect(() => {
        const { shareId, type, linkId } = match.params;

        const initialResource = toResource(shareId, type, linkId);

        if (type === ResourceURLType.FOLDER && initialResource) {
            setResource(initialResource);
        } else if (!initialResource) {
            const meta = cache.get.defaultShareMeta();

            if (!meta) {
                throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
            }

            setResource({ shareId: meta.ShareID, linkId: meta.LinkID, type: ResourceType.FOLDER });
        }
    }, [match.params]);

    // TODO: change toolbar props to optional children in react-components
    return (
        <Page title={c('Title').t`My files`}>
            <DriveContentProvider>
                {resource ? (
                    <DriveToolbar resource={resource} openResource={navigateToResource} />
                ) : (
                    <Toolbar>{null}</Toolbar>
                )}
                <PageMainArea hasToolbar className="flex flex-column">
                    <StickyHeader>
                        {resource && <DriveBreadcrumbs openResource={navigateToResource} resource={resource} />}
                    </StickyHeader>

                    {resource && <Drive resource={resource} openResource={navigateToResource} />}
                </PageMainArea>
            </DriveContentProvider>
        </Page>
    );
}

export default DriveContainer;
