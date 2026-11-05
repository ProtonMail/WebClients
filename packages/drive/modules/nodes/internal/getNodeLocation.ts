import { type Device, type NodeEntity, NodeType } from '@protontech/drive-sdk';
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

const isPhotosNode = (node: NodeEntity) => node.type === NodeType.Album || node.type === NodeType.Photo;

/**
 * Returns where the node is, from its hierarchy (from the root to the node).
 */
export async function getNodeLocation(
    drive: Omit<ProtonDriveClientOrPublicDriveClient, 'getNode'>,
    hierarchy: NodeEntity[]
): Promise<NodeLocation> {
    if (isPhotosNode(hierarchy[hierarchy.length - 1])) {
        return NodeLocation.PHOTOS;
    }

    const rootNode = hierarchy[0];
    // If node have a membership it means it is a direct share
    // We also check the getMyFilesRootFolder presence to exclude public page
    if (Boolean(rootNode.membership && drive.getMyFilesRootFolder)) {
        return NodeLocation.SHARED_WITH_ME;
    }

    let myFilesRootFolderUid: string | undefined;
    if (drive.getMyFilesRootFolder) {
        const myFilesRootFolder = await drive.getMyFilesRootFolder();
        myFilesRootFolderUid = myFilesRootFolder.uid;
    }

    if (rootNode.uid === myFilesRootFolderUid) {
        return NodeLocation.MY_FILES;
    }

    // NOTE: We use the presence of iterateDevices method to understand if we are not using a public drive client.
    if (drive.iterateDevices) {
        return NodeLocation.DEVICES;
    }

    return NodeLocation.PUBLIC_PAGE;
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
    if (isPhotosNode(node)) {
        return formatNodeLocation(NodeLocation.PHOTOS, []);
    }

    const ancestry = await getNodeAncestry(node.uid, drive);
    if (!ancestry.ok) {
        handleSdkError(ancestry.error);
        return c('Error').t`Unknown location`;
    }
    return getFormattedNodeLocationFromHierarchy(drive, ancestry.value);
}

/**
 * Same as `getFormattedNodeLocation`, for a hierarchy already loaded with `getNodeHierarchy`
 * (from the root to the node).
 */
export async function getFormattedNodeLocationFromHierarchy(
    drive: Omit<ProtonDriveClientOrPublicDriveClient, 'getNode'>,
    hierarchy: NodeEntity[]
): Promise<string> {
    const location = await getNodeLocation(drive, hierarchy);
    return formatNodeLocation(location, hierarchy.slice(0, -1));
}

/**
 * Same as `getFormattedNodeLocation`, loading the hierarchy with `getNodeHierarchy`.
 */
export async function getFormattedNodeLocationUsingHierarchy(
    drive: Omit<ProtonDriveClientOrPublicDriveClient, 'getNode'> & {
        getNodeHierarchy: (uid: string) => Promise<NodeEntity[]>;
    },
    node: NodeEntity
): Promise<string> {
    let hierarchy: NodeEntity[];
    try {
        hierarchy = await drive.getNodeHierarchy(node.uid);
    } catch (e) {
        handleSdkError(e);
        return c('Error').t`Unknown location`;
    }
    return getFormattedNodeLocationFromHierarchy(drive, hierarchy);
}
