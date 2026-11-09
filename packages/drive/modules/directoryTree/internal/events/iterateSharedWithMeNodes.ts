import { sendErrorReport } from '../../../../modules/busDriver';
import type { NodeEntity } from '../../../../sdk';
import { getDrive } from '../../../../sdk';
import { iterateNodesFromUidsGenerator } from '../../../nodes';

export async function iterateSharedWithMeNodes(abortSignal?: AbortSignal) {
    const result: { node: NodeEntity }[] = [];
    try {
        const drive = getDrive();
        const nodeUidsIterator = drive.iterateSharedWithMeNodeUids(abortSignal);
        for await (const node of iterateNodesFromUidsGenerator(nodeUidsIterator, drive, { signal: abortSignal })) {
            result.push({ node });
        }
    } catch (error) {
        sendErrorReport(error);
    }
    return result;
}
