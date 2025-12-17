import type { NodeEntity } from '@proton/drive/index';
import { getDrive, getDriveForPhotos } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

export const checkUnsupportedNode = (node: NodeEntity) => {
    const mediaType = node.mediaType ?? '';
    return isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType);
};

export const hydrateAndCheckNodes = async (uids: string[]) => {
    const drive = getDrive();
    const nodes: NodeEntity[] = [];
    let containsUnsupportedFile;
    for await (const maybeNode of drive.iterateNodes(uids)) {
        if (!maybeNode.ok) {
            continue;
        }
        const { node } = getNodeEntity(maybeNode);
        nodes.push(node);
        if (checkUnsupportedNode(node)) {
            containsUnsupportedFile = true;
        }
    }

    return { nodes, containsUnsupportedFile };
};

export const hydratePhotos = async (uids: string[]) => {
    const drive = getDriveForPhotos();
    const nodes: NodeEntity[] = [];
    for await (const maybeNode of drive.iterateNodes(uids)) {
        if (!maybeNode.ok) {
            continue;
        }
        const { node, photoAttributes } = getNodeEntity(maybeNode);
        nodes.push(node);
        if (photoAttributes?.relatedPhotoNodeUids) {
            for (const relatedUid of photoAttributes.relatedPhotoNodeUids) {
                const relatedMaybeNode = await drive.getNode(relatedUid);
                const { node: relatedNode } = getNodeEntity(relatedMaybeNode);
                nodes.push(relatedNode);
            }
        }
    }

    return { nodes };
};
