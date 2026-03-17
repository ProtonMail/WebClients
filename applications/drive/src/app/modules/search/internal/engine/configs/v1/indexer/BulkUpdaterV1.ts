import type { MaybeNode } from '@proton/drive';
import { NodeType } from '@proton/drive';

import { getNodeEntity } from '../../../../../../../utils/sdk/getNodeEntity';
import { Logger } from '../../../../Logger';
import type { MainThreadBridge } from '../../../../MainThreadBridge';
import { BaseBulkUpdater } from '../../../core/indexer/BaseBulkUpdater';
import type { IndexEntry } from '../../../core/indexer/types';

// A simple bulk updater that iteratively indexes all files in My Files,
// excluding trashed items. It is fully in-memory: if the bulk indexer fails
// it will throw, and the state machine will be responsible of handling them.
// There is no in-progress persistence.
//
// TODO: Make bulk indexing resumable by persisting intermediate state (queue + cursor)
// so the state machine can resume after offline/online transitions instead of restarting
// from scratch. This likely requires backend support for resumable tree traversal.
export class BulkUpdaterV1 extends BaseBulkUpdater {
    async *visitAndProduceIndexEntries(bridge: MainThreadBridge): AsyncIterableIterator<IndexEntry> {
        try {
            const maybeNode = await bridge.driveSdk.getMyFilesRootFolder();
            const rootNode = getNodeEntity(maybeNode).node;

            const queue: { folderUid: string; parentPath: string }[] = [{ folderUid: rootNode.uid, parentPath: '' }];

            while (queue.length > 0) {
                const item = queue.shift();
                if (!item) {
                    break;
                }
                const { folderUid, parentPath } = item;

                // TODO: Check for AbortError here.
                // TODO: Catch thrown decryption errors and mark node uids to be repaired
                // asynchronously.
                const children = await bridge.driveSdk.iterateFolderChildren(folderUid);

                for (const child of children) {
                    const hasIndexableFilename = child.ok || (child.error.name && child.error.name.ok);
                    if (!hasIndexableFilename) {
                        continue;

                        // TODO: Mark node with name issue to be repaired asynchronously later,
                        // maybe during the incremental update.
                    }

                    const { node } = getNodeEntity(child);

                    if (node.trashTime) {
                        // Exclude trash nodes and descendant from bulk indexing.
                        continue;
                    }

                    yield createIndexEntry(child, parentPath);

                    if (node.type === NodeType.Folder) {
                        queue.push({ folderUid: node.uid, parentPath: `${parentPath}/${node.uid}` });
                    }
                }
            }
        } catch (e) {
            Logger.error('BulkUpdaterV1 error', e);

            // Forward exceptions, the state machine will be responsible of handling them and
            // restarting the bulk indexing.

            // TODO: Make bulk indexing resumable by persisting intermediate state (with some kind of cursor)
            // so the state machine can resume after transient errors (offline, temporary SDK errors, quota reached HTTP 429, ...)
            // instead of restarting from scratch. This likely will require a good heuristic to resume tree visits (per folder, using
            // backend cursors, etc). Note that permanent errors (e.g. no db space: Quota exceeded) will still throw here even to be handled
            // by the state machine.
            throw e;
        }
    }
}

function createIndexEntry(maybeNode: MaybeNode, parentPath: string): IndexEntry {
    const { node } = getNodeEntity(maybeNode);
    return {
        documentId: node.uid,
        // TODO: Convert these attributes into core search attributes (e.g any IndexEntry produce should produce them in any engine)
        attributes: [
            {
                name: 'filename',
                value: { kind: 'text', value: node.name },
            },
            {
                name: 'path',
                value: { kind: 'text', value: parentPath },
            },
            {
                name: 'creationTime',
                value: { kind: 'integer', value: BigInt(node.creationTime.getTime()) },
            },
            {
                name: 'modificationTime',
                value: { kind: 'integer', value: BigInt(node.modificationTime.getTime()) },
            },
            {
                name: 'nodeType',
                value: { kind: 'tag', value: node.type },
            },
            {
                name: 'mediaType',
                value: { kind: 'text', value: node.mediaType || '' },
            },
        ],
    };
}
