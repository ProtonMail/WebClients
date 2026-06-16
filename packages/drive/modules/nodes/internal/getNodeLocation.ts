import { type Device, type NodeEntity, NodeType, type Result } from '@protontech/drive-sdk';
import { c } from 'ttag';

import { handleSdkError } from '../../../legacy/errorHandling';
import { getNodeAncestry } from './getNodeAncestry';
import { getNodeName } from './getNodeName';

export enum NodeLocation {
    MY_FILES = 'MY_FILES',
    DEVICES = 'DEVICES',
    PHOTOS = 'PHOTOS',
    SHARED_WITH_ME = 'SHARED_WITH_ME',
    PUBLIC_PAGE = 'PUBLIC_PAGE',
}

export type ProtonDriveClientOrPublicDriveClient = {
    getNode: (uid: string) => Promise<NodeEntity>;
    getMyFilesRootFolder?: () => Promise<NodeEntity>;
    iterateDevices?: (signal?: AbortSignal) => AsyncGenerator<Device>;
};

export async function getNodeLocation(
    drive: ProtonDriveClientOrPublicDriveClient,
    node: NodeEntity
): Promise<Result<NodeLocation, Error>> {
    if (node.type === NodeType.Album || node.type === NodeType.Photo) {
        return {
            ok: true,
            value: NodeLocation.PHOTOS,
        };
    }

    const nodesResult = await getNodeAncestry(node.uid, drive);
    if (!nodesResult.ok) {
        return {
            ok: false,
            error: nodesResult.error,
        };
    }
    const nodes = nodesResult.value;
    const rootNode = nodes[0];
    // If node have a membership it means it is a direct share
    // We also check the getMyFilesRootFolder presence to exclude public page
    if (Boolean(rootNode.membership && drive.getMyFilesRootFolder)) {
        return {
            ok: true,
            value: NodeLocation.SHARED_WITH_ME,
        };
    }

    let myFilesRootFolderUid: string | undefined;
    if (drive.getMyFilesRootFolder) {
        const myFilesRootFolder = await drive.getMyFilesRootFolder();
        myFilesRootFolderUid = myFilesRootFolder.uid;
    }

    if (rootNode.uid === myFilesRootFolderUid) {
        return {
            ok: true,
            value: NodeLocation.MY_FILES,
        };
    }

    // NOTE: We use the presence of iterateDevices method to understand if we are not using a public drive client.
    if (drive.iterateDevices) {
        return {
            ok: true,
            value: NodeLocation.DEVICES,
        };
    }

    return {
        ok: true,
        value: NodeLocation.PUBLIC_PAGE,
    };
}

const formatPath = (pathItems: string[], additionalTopNodeName?: string) => {
    const paths = additionalTopNodeName ? [additionalTopNodeName, ...pathItems] : pathItems;
    return `/${paths.join('/')}`;
};

const BreadcrumbsTopitemLabels = {
    MY_FILES: c('Title').t`My files`,
    SHARED_WITH_ME: c('Title').t`Shared with me`,
    DEVICES: c('Title').t`Devices`,
    PHOTOS: c('Title').t`Photos`,
};

export const formatNodeLocation = (nodeLocationRoot: NodeLocation, path: NodeEntity[]) => {
    const pathItems = path.map(getNodeName);
    switch (nodeLocationRoot) {
        case NodeLocation.PHOTOS:
            return formatPath([], BreadcrumbsTopitemLabels.PHOTOS);
        case NodeLocation.MY_FILES:
            // Replace root folder generic/technical name by a human-readable one:
            pathItems.shift();
            return formatPath(pathItems, BreadcrumbsTopitemLabels.MY_FILES);
        case NodeLocation.SHARED_WITH_ME:
            // Add a virtual (UI-only) top level folder
            return formatPath(pathItems, BreadcrumbsTopitemLabels.SHARED_WITH_ME);
        case NodeLocation.DEVICES:
            // Add a virtual (UI-only) top level folder
            return formatPath(pathItems, BreadcrumbsTopitemLabels.DEVICES);
        case NodeLocation.PUBLIC_PAGE:
        default:
            // No top label for public folder
            return formatPath(pathItems);
    }
};

export async function getFormattedNodeLocation(
    drive: ProtonDriveClientOrPublicDriveClient,
    node: NodeEntity
): Promise<string> {
    const location = await getNodeLocation(drive, node);

    const formattedLocationError = c('Error').t`Unknown location`;
    if (!location.ok) {
        handleSdkError(location.error);
        return formattedLocationError;
    }
    const nodeLocation = location.value;
    const needsPath = nodeLocation !== NodeLocation.PHOTOS;

    let path: NodeEntity[] = [];
    if (needsPath) {
        const ancestryResult = await getNodeAncestry(node.uid, drive, false);
        if (!ancestryResult.ok) {
            handleSdkError(ancestryResult.error);
            return formattedLocationError;
        }
        path = ancestryResult.value;
    }

    return formatNodeLocation(location.value, path);
}
