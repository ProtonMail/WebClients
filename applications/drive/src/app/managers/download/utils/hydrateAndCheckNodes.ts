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
    for (const uid of uids) {
        const maybeNode = await drive.getNode(uid);
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
    for (const uid of uids) {
        const maybeNode = await drive.getNode(uid);
        const { node } = getNodeEntity(maybeNode);
        nodes.push(node);
    }

    return { nodes };
};
