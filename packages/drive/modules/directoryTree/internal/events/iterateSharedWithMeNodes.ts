import type { NodeEntity } from '../../../../index';
import { getDrive } from '../../../../index';
import { sendErrorReport } from '../../../../internal/BusDriver/errorHandling';
import { getNodeEntity } from '../../../../legacy/sdkUtils/getNodeEntity';

export async function iterateSharedWithMeNodes(abortSignal?: AbortSignal) {
    const result: { node: NodeEntity }[] = [];
    try {
        for await (const maybeNode of getDrive().iterateSharedNodesWithMe(abortSignal)) {
            const { node } = getNodeEntity(maybeNode);
            result.push({ node });
        }
    } catch (error) {
        sendErrorReport(error);
    }
    return result;
}
