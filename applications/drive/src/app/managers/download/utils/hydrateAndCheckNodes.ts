import type { NodeEntity } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

export const hydrateAndCheckNodes = async (uids: string[]) => {
    const drive = getDrive();
    const nodes: NodeEntity[] = [];
    let containsUnsupportedFile = false;
    for (const uid of uids) {
        const maybeNode = await drive.getNode(uid);
        const { node } = getNodeEntity(maybeNode);
        const mediaType = node.mediaType ?? '';
        if (isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType)) {
            containsUnsupportedFile = true;
        } else {
            nodes.push(node);
        }
    }

    return { nodes, containsUnsupportedFile };
};
