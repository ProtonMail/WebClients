import { useMemo } from 'react';

import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import { type ArtifactRegistry, buildArtifactRegistry } from './artifactRegistry';

/**
 * Derives the conversation-wide artifact registry from the active linear message chain.
 * Recomputes only when the set of finalized assistant messages changes — never on
 * intra-token streaming re-renders, since a streaming message has no `status` yet.
 */
export function useArtifactRegistry(linearChain: Message[]): ArtifactRegistry {
    const finalizedAssistantMessageIds = useMemo(
        () =>
            linearChain
                .filter((message) => message.role === Role.Assistant && message.status !== undefined)
                .map((message) => message.id)
                .join(','),
        [linearChain]
    );

    return useMemo(
        () => buildArtifactRegistry(linearChain),

        [finalizedAssistantMessageIds]
    );
}
