import { sendErrorReport } from '../../../../modules/busDriver';
import type { NodeEntity } from '../../../../sdk';
import { getDrive } from '../../../../sdk';

export async function iterateSharedWithMeNodes(abortSignal?: AbortSignal) {
    const result: { node: NodeEntity }[] = [];
    try {
        for await (const node of getDrive().iterateSharedNodesWithMe(abortSignal)) {
            result.push({ node });
        }
    } catch (error) {
        sendErrorReport(error);
    }
    return result;
}
