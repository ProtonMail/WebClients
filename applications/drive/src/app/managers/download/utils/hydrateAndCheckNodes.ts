import { c } from 'ttag';

import type { MaybeNode, NodeEntity } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
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
        if (!maybeNode.ok && 'missingUid' in maybeNode.error) {
            throw new Error(missingNodeErrorMessage);
        }
        const { node } = getNodeEntity(maybeNode as MaybeNode);
        nodes.push(node);
        if (checkUnsupportedNode(node)) {
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
        if (!maybeNode.ok && 'missingUid' in maybeNode.error) {
            throw new Error(missingNodeErrorMessage);
        }
        const { node, photoAttributes } = getNodeEntity(maybeNode as MaybeNode);
        nodes.push(node);
        if (photoAttributes?.relatedPhotoNodeUids) {
            for (const relatedUid of photoAttributes.relatedPhotoNodeUids) {
                const relatedMaybeNode = await drivePhotosClient.getNode(relatedUid);
                const { node: relatedNode } = getNodeEntity(relatedMaybeNode);
                nodes.push(relatedNode);
            }
        }
    }

    return { nodes, containsUnsupportedFile: undefined };
};
