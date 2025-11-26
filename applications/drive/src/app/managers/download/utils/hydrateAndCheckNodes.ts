import type { NodeEntity } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

export const checkUnsupportedNode = (node: NodeEntity) => {
    const mediaType = node.mediaType ?? '';
    return isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType);
};

export const hydrateAndCheckNodes = async (uids: string[]) => {
    const drive = getDrive();
    const nodes: NodeEntity[] = [];
    let containsUnsupportedFile = false;
    for (const uid of uids) {
        const maybeNode = await drive.getNode(uid);
        const { node } = getNodeEntity(maybeNode);
        if (checkUnsupportedNode(node)) {
            containsUnsupportedFile = true;
        } else {
            nodes.push(node);
        }
    }

    return { nodes, containsUnsupportedFile };
};
