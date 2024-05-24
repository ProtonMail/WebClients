import { useRef } from 'react';

import { queryResolveContextShare } from '@proton/shared/lib/api/drive/share';

import { useDebouncedRequest } from '../../store/_api';
import { useAbortSignal } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { LegacyNodeMeta, NodeMeta } from '../interface';

/**
 * Gets the cache key for a `NodeMeta` pair.
 */
const getCacheKey = ({ volumeId, linkId }: NodeMeta) => `${volumeId}:${linkId}`;

export const useResolveShareId = () => {
    const cache = useRef(new Map<string, string>());
    const debouncedRequest = useDebouncedRequest();
    const abortSignal = useAbortSignal([]);

    /**
     * Resolves the context shareId for a given `NodeMeta`.
     *
     * @param force Bypass the cache and refetch a new shareId.
     */
    const resolveShareId = async (nodeId: NodeMeta, force?: boolean): Promise<LegacyNodeMeta> => {
        const cached = cache.current.get(getCacheKey(nodeId));
        if (cached && !force) {
            return { shareId: cached, volumeId: nodeId.volumeId, linkId: nodeId.linkId };
        }

        try {
            const { ContextShareID: shareId } = await debouncedRequest<{ ContextShareID: string }>({
                ...queryResolveContextShare(nodeId),
                signal: abortSignal,
            });

            cache.current.set(getCacheKey(nodeId), shareId);

            return { shareId, volumeId: nodeId.volumeId, linkId: nodeId.linkId };
        } catch (e) {
            throw new EnrichedError('Unable to resolve shareId from volumeId', {
                tags: {
                    volumeId: nodeId.volumeId,
                },
                extra: { e },
            });
        }
    };

    /**
     * Wraps an existing function with a shareId resolver.
     */
    const withResolve = <T extends unknown[], R>(fn: (nodeId: LegacyNodeMeta, ...args: T) => Promise<R>) => {
        return async (id: NodeMeta, ...args: T): Promise<R> => {
            const nodeId = await resolveShareId(id);

            return fn(nodeId, ...args);
        };
    };

    return { resolveShareId, withResolve };
};
