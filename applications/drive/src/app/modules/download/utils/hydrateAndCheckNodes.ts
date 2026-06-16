import { c } from 'ttag';

import type { NodeEntity } from '@proton/drive/index';
import { isMissingNode } from '@proton/drive/modules/nodes';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { DownloadDriveClientRegistry } from '../DownloadDriveClientRegistry';

export const checkUnsupportedNode = (node: NodeEntity) => {
    const mediaType = node.mediaType ?? '';
    return isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType);
};

export const hydrateAndCheckNodes = async (uids: string[]) => {
    const missingNodeErrorMessage = c('Info').t`Requested item doesn't exist anymore`;
    const driveClient = DownloadDriveClientRegistry.getDriveClient();
    const nodes: NodeEntity[] = [];
    let containsUnsupportedFile;
    for await (const maybeNode of driveClient.iterateNodes(uids)) {
        if (isMissingNode(maybeNode)) {
            throw new Error(missingNodeErrorMessage);
        }
        nodes.push(maybeNode);
        if (checkUnsupportedNode(maybeNode)) {
            containsUnsupportedFile = true;
        }
    }

    return { nodes, containsUnsupportedFile };
};

export const hydratePhotos = async (uids: string[]) => {
    const missingNodeErrorMessage = c('Info').t`Requested item doesn't exist anymore`;
    const drivePhotosClient = DownloadDriveClientRegistry.getDrivePhotosClient();
    const nodes: NodeEntity[] = [];
    for await (const maybeNode of drivePhotosClient.iterateNodes(uids)) {
        if (isMissingNode(maybeNode)) {
            throw new Error(missingNodeErrorMessage);
        }
        nodes.push(maybeNode);
        const photoNode = maybeNode;
        if (photoNode.photo?.relatedPhotoNodeUids) {
            for (const relatedUid of photoNode.photo.relatedPhotoNodeUids) {
                const relatedNode = await drivePhotosClient.getNode(relatedUid);
                nodes.push(relatedNode);
            }
        }
    }

    return { nodes, containsUnsupportedFile: undefined };
};
