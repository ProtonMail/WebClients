import { useMemo } from 'react';

import { getMessageBlocks } from '../../../messageHelpers';
import type { Message } from '../../../types';
import { isManualArtifactEditMessage } from '../../../types';
import { Role } from '../../../types-api';
import {
    type ArtifactRegistry,
    buildArtifactRegistry,
    getInFlightArtifactFingerprint,
    mergeProvisionalArtifactRegistry,
} from './artifactRegistry';
import { getCompleteArtifactBlocksKey } from './createArtifactTool';

/**
 * Derives the conversation-wide artifact registry from the active linear message chain.
 * Finalized versions come from completed assistant messages (or a manual-edit message, the
 * user directly editing the artifact); provisional versions are overlaid from in-flight
 * messages that already have a complete create_artifact tool call.
 *
 * Recomputes when finalized/manual-edit artifacts load or when an in-flight artifact
 * fingerprint changes — never on intra-token prose streaming alone.
 */
export function useArtifactRegistry(linearChain: Message[]): ArtifactRegistry {
    const finalizedArtifactFingerprint = useMemo(
        () =>
            linearChain
                .filter((message) => {
                    return (
                        (message.role === Role.Assistant && message.status !== undefined) ||
                        isManualArtifactEditMessage(message)
                    );
                })
                .map((message) => {
                    // Saved messages can acquire their decrypted blocks after the ID is already present.
                    return `${message.id}:${getCompleteArtifactBlocksKey(getMessageBlocks(message))}`;
                })
                .join(','),
        [linearChain]
    );

    const inFlightArtifactFingerprint = useMemo(() => {
        return getInFlightArtifactFingerprint(linearChain);
    }, [linearChain]);

    return useMemo(() => {
        const finalizedRegistry = buildArtifactRegistry(linearChain);
        return mergeProvisionalArtifactRegistry(finalizedRegistry, linearChain);
    }, [finalizedArtifactFingerprint, inFlightArtifactFingerprint]);
}
