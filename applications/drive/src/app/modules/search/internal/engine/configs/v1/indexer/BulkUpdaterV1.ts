import type { MaybeNode } from '@proton/drive';

import { getNodeEntity } from '../../../../../../../utils/sdk/getNodeEntity';
import type { MainThreadBridge } from '../../../../MainThreadBridge';
import { BaseBulkUpdater } from '../../../core/indexer/BaseBulkUpdater';
import type { IndexEntry } from '../../../core/indexer/types';

export class BulkUpdaterV1 extends BaseBulkUpdater {
    async *visitAndProduceIndexEntries(bridge: MainThreadBridge): AsyncIterableIterator<IndexEntry> {
        const maybeNode = await bridge.driveSdk.getMyFilesRootFolder();
        const nodeEntity = getNodeEntity(maybeNode);

        const children = await bridge.driveSdk.iterateFolderChildren(nodeEntity.node.uid);
        for (const node of children) {
            yield createIndexEntry(node);

            // TODO: Recursively traverse My Files
            // TODO: Filter out trashed items
            // TODO: Add unit tests
        }
    }
}

function createIndexEntry(maybeNode: MaybeNode): IndexEntry {
    const { node } = getNodeEntity(maybeNode);
    return {
        documentId: node.uid,
        attributes: [
            {
                name: 'filename',
                value: { kind: 'text', value: node.name },
            },
            // TODO: Add path
            // TODO: Add file type
            // TODO: Add creation / modification dates
        ],
    };
}
