import { AbortError, type MissingNode, ProtonDriveError } from '@protontech/drive-sdk';
import { c } from 'ttag';

import { logging } from '../../logging';
import { isMissingNode } from './node';

const logger = logging.getLogger('nodes');

// Same batch size the SDK uses when it loads nodes for its own iterators.
const BATCH_SIZE = 30;

type NodesLoader<T extends object> = {
    iterateNodes(nodeUids: string[], signal?: AbortSignal): AsyncGenerator<T | MissingNode>;
};

/**
 * Loads the nodes of a UID listing (folder children, trash, shared...) in batches.
 *
 * Use it only when the UIDs come from an iterator, so the full list is not known
 * yet: it starts loading nodes while the listing is still running. If you already
 * have the full list of UIDs, pass it to `drive.iterateNodes` directly, which
 * batches on its own.
 *
 * A UID that comes back as missing was deleted between the listing and the
 * loading: it is skipped and logged, never yielded. Degraded nodes are yielded
 * as is.
 *
 * A failed batch does not stop the listing: like the SDK's deprecated iterators,
 * the remaining batches are still loaded and one error is thrown at the end.
 * Aborts and listing errors are thrown right away.
 */
export async function* iterateNodesFromUidsGenerator<T extends object>(
    nodeUidsIterator: AsyncIterable<string>,
    drive: NodesLoader<T>,
    { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<T> {
    let missingCount = 0;
    const errors: unknown[] = [];

    async function* loadBatch(batch: string[]): AsyncGenerator<T> {
        try {
            for await (const maybeMissingNode of drive.iterateNodes(batch, signal)) {
                if (isMissingNode(maybeMissingNode)) {
                    missingCount++;
                    logger.debug(`Skipping missing node ${maybeMissingNode.missingUid}`);
                    continue;
                }
                yield maybeMissingNode;
            }
        } catch (error) {
            if (error instanceof AbortError) {
                throw error;
            }
            errors.push(error);
        }
    }

    let batch: string[] = [];
    for await (const nodeUid of nodeUidsIterator) {
        batch.push(nodeUid);
        if (batch.length >= BATCH_SIZE) {
            yield* loadBatch(batch);
            batch = [];
        }
    }
    if (batch.length > 0) {
        yield* loadBatch(batch);
    }

    if (missingCount > 0) {
        logger.info(`Skipped ${missingCount} missing nodes from the listing`);
    }

    if (errors.length > 0) {
        // Same error as the SDK's deprecated iterators, so callers handle it the same way.
        throw new ProtonDriveError(c('Error').t`Some items could not be loaded`, { cause: errors });
    }
}
