import { c } from 'ttag';

import { type Device, type MaybeNode, NodeType, type Result } from '@proton/drive';

import { handleSdkError } from '../errorHandling/useSdkErrorHandler';
import { getNodeAncestry } from './getNodeAncestry';
import { getNodeEntity } from './getNodeEntity';
import { getNodeName } from './getNodeName';
import { isOwnFile } from './isOwnFile';

export enum NodeLocation {
    MY_FILES = 'MY_FILES',
    DEVICES = 'DEVICES',
    PHOTOS = 'PHOTOS',
    SHARED_WITH_ME = 'SHARED_WITH_ME',
    PUBLIC_PAGE = 'PUBLIC_PAGE',
}

export type ProtonDriveClientOrPublicDriveClient = {
    getNode: (uid: string) => Promise<MaybeNode>;
    getMyFilesRootFolder?: () => Promise<MaybeNode>;
    iterateDevices?: (signal?: AbortSignal) => AsyncGenerator<Device>;
};

export async function getNodeLocation(
    drive: ProtonDriveClientOrPublicDriveClient,
    node: MaybeNode
): Promise<Result<NodeLocation, Error>> {
    const currentNodeEntity = getNodeEntity(node).node;

    if (currentNodeEntity.type === NodeType.Album || currentNodeEntity.type === NodeType.Photo) {
        return {
            ok: true,
            value: NodeLocation.PHOTOS,
        };
    }

    const nodesResult = await getNodeAncestry(currentNodeEntity.uid, drive);
    if (!nodesResult.ok) {
        return {
            ok: false,
            error: nodesResult.error,
        };
    }
    const nodes = nodesResult.value;
    const rootNodeEntity = getNodeEntity(nodes[0]).node;

    // In case there is no membership it is a public shared node
    if (!isOwnFile(node) && !!rootNodeEntity.membership) {
        return {
            ok: true,
            value: NodeLocation.SHARED_WITH_ME,
        };
    }

    let myFilesRootFolderUid: string | undefined;
    if (drive.getMyFilesRootFolder) {
        const myFilesRootFolder = await drive.getMyFilesRootFolder();
        myFilesRootFolderUid = myFilesRootFolder.ok ? myFilesRootFolder.value.uid : myFilesRootFolder.error.uid;
    }

    if (rootNodeEntity.uid === myFilesRootFolderUid) {
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

export const formatNodeLocation = (nodeLocationRoot: NodeLocation, path: MaybeNode[]) => {
    const pathItems = path.map(getNodeName);
    switch (nodeLocationRoot) {
        case NodeLocation.PHOTOS:
            return BreadcrumbsTopitemLabels.PHOTOS;
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
    node: MaybeNode
): Promise<string> {
    const location = await getNodeLocation(drive, node);

    const formattedLocationError = c('Error').t`Unknown location`;
    if (!location.ok) {
        handleSdkError(location.error);
        return formattedLocationError;
    }
    const nodeLocation = location.value;
    const needsPath = nodeLocation !== NodeLocation.PHOTOS;

    let path: MaybeNode[] = [];
    if (needsPath) {
        const ancestryResult = await getNodeAncestry(getNodeEntity(node).node.uid, drive, false);
        if (!ancestryResult.ok) {
            handleSdkError(ancestryResult.error);
            return formattedLocationError;
        }
        path = ancestryResult.value;
    }

    return formatNodeLocation(location.value, path);
}
