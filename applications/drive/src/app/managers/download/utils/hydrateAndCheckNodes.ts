import type { NodeEntity } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

export const hydrateAndCheckNodes = async (uids: string[]): Promise<NodeEntity[]> => {
    const drive = getDrive();
    const nodeEntities: NodeEntity[] = [];
    for (const uid of uids) {
        const maybeNode = await drive.getNode(uid);
        const { node } = getNodeEntity(maybeNode);
        nodeEntities.push(node);
    }

    return nodeEntities;
};
