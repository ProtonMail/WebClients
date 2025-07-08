import {
    queryListNodesWithMissingNodeHashKeys,
    querySendNodesWithNewNodeHashKeys,
} from '@proton/shared/lib/api/drive/sanitization';
import { generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';

export const useSanitization = () => {
    const debouncedRequest = useDebouncedRequest();

    const driveEventManager = useDriveEventManager();

    const { getLinkPrivateKey } = useLink();

    const restoreHashKey = async () => {
        const abortSignal = new AbortController().signal;
        const { NodesWithMissingNodeHashKey: nodesWithMissingNodeHashKey } = await debouncedRequest<{
            NodesWithMissingNodeHashKey: {
                LinkID: string;
                ShareID: string;
                VolumeID: string;
                PGPArmoredEncryptedNodeHashKey: string;
            }[];
            Code: number;
        }>(queryListNodesWithMissingNodeHashKeys(), abortSignal);

        if (!nodesWithMissingNodeHashKey.length) {
            return;
        }

        const nodesWithNewNodeHashKey = await Promise.all(
            nodesWithMissingNodeHashKey.map(async (node) => {
                const privateKey = await getLinkPrivateKey(abortSignal, node.ShareID, node.LinkID);

                const { NodeHashKey } = await generateNodeHashKey(privateKey, privateKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt node hash key during restore hash key process', {
                            tags: {
                                linkId: node.LinkID,
                                shareId: node.ShareID,
                                volumeId: node.VolumeID,
                            },
                            extra: { e },
                        })
                    )
                );
                return { ...node, PGPArmoredEncryptedNodeHashKey: NodeHashKey };
            })
        );

        await debouncedRequest<{
            Code: number;
        }>(querySendNodesWithNewNodeHashKeys({ NodesWithMissingNodeHashKey: nodesWithNewNodeHashKey }), abortSignal);

        const volumeIds = nodesWithMissingNodeHashKey.map((node) => node.VolumeID);
        await driveEventManager.pollEvents.volumes(volumeIds);
    };

    return { restoreHashKey };
};
