import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';
import Drive from '../components/Drive';
import useDrive from '../hooks/useDrive';
import { LinkType, ResourceType } from '../interfaces/folder';
import Page from '../components/Page';
import StickyHeader from '../components/StickyHeader';
import { DriveResource, useDriveResource } from '../components/DriveResourceProvider';
import DriveToolbar from '../components/DriveToolbar';
import useFileBrowser from '../components/FileBrowser/useFileBrowser';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';

const toResourceType = (type: LinkType) => {
    const resourceType = {
        [LinkType.FILE]: ResourceType.FILE,
        [LinkType.FOLDER]: ResourceType.FOLDER
    }[type];

    if (!resourceType) {
        throw new Error(`Type ${type} is unexpected, must be file or folder`);
    }

    return resourceType;
};

const toLinkType = (type: ResourceType) => {
    const linkType = {
        [ResourceType.FILE]: LinkType.FILE,
        [ResourceType.FOLDER]: LinkType.FOLDER
    }[type];

    if (!linkType) {
        throw new Error(`Type ${type} is unexpected, must be integer representing resource type`);
    }

    return linkType;
};

const toResource = (shareId?: string, type?: LinkType, linkId?: string): DriveResource | undefined => {
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
}: RouteComponentProps<{ shareId?: string; type?: LinkType; linkId?: string }>) {
    const { loadDrive } = useDrive();
    const { resource, setResource } = useDriveResource();
    const [, setError] = useState();

    const [fileBrowserContents, setFileBrowserContents] = useState<FileBrowserItem[]>();
    const fileBrowserControls = useFileBrowser(fileBrowserContents);

    const navigateToResource = (resource: DriveResource, item?: FileBrowserItem) => {
        history.push(`/drive/${resource.shareId}/${toLinkType(resource.type)}/${resource.linkId}`, item);
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
        <Page
            title={c('Title').t`My files`}
            className="flex flex-column"
            toolbar={
                resource && (
                    <DriveToolbar
                        selectedItems={fileBrowserControls.selectedItems}
                        resource={resource}
                        openResource={navigateToResource}
                    />
                )
            }
        >
            <StickyHeader>
                <h3 className="mb0">{c('Title').t`My files`}</h3>
            </StickyHeader>
            {resource && (
                <Drive
                    setContents={setFileBrowserContents}
                    contents={fileBrowserContents}
                    fileBrowserControls={fileBrowserControls}
                    resource={resource}
                    openResource={navigateToResource}
                />
            )}
        </Page>
    );
}

export default DriveContainer;
