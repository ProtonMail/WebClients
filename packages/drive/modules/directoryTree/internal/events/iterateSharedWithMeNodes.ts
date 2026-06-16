import type { NodeEntity } from '../../../../index';
import { getDrive } from '../../../../index';
import { sendErrorReport } from '../../../../modules/busDriver';

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
