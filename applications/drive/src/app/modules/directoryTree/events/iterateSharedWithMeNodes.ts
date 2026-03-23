import type { NodeEntity } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { sendErrorReport } from '@proton/drive/internal/BusDriver/errorHandling';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

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
