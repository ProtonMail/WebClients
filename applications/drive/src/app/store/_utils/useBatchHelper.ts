import { useCallback } from 'react';

import usePreventLeave from '@proton/components/hooks/usePreventLeave';
import { API_CODES } from '@proton/shared/lib/constants';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import chunk from '@proton/utils/chunk';

import { useDebouncedRequest } from '../_api';

/**
 * Custom hook that will return helper function for processing operations on multiple links in batches.
 * Breaks large sets of links into smaller batches for API requests,
 * executes them in parallel (up to a limit), and tracks successes and failures.
 *
 * @returns A batch helper function for processing operations in batches
 */

export const useBatchHelper = () => {
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();

    /**
     * Helper for processing operations on multiple links in batches.
     * Breaks large sets of links into smaller batches for API requests,
     * executes them in parallel (up to a limit), and tracks successes and failures.
     *
     * @returns A batch helper function that processes operations in batches
     *   @param {AbortSignal} abortSignal - Signal to abort the operation
     *   @param {Object} options - Batch operation options
     *   @param {string} options.shareId - The ID of the share containing the links
     *   @param {string[]} options.linkIds - Array of link IDs to process
     *   @param {Function} options.query - Function that generates the API request for a batch of link IDs
     *   @param {number} [options.maxParallelRequests] - Maximum number of parallel requests
     *   @param {number} [options.batchRequestSize] - Maximum number of links per batch
     *   @param {Function} [options.request] - Custom request function to use instead of the default (used for public request)
     *   @param {number[]} [options.allowedCodes] - Array of response codes to consider as successful besides 1000
     *   @returns {Promise<{responses: Array, successes: string[], failures: Object}>}
     */
    const batchHelper = useCallback(
        async <T extends { Responses: { LinkID: string; Response: { Code: number; Error?: string } }[] }>(
            abortSignal: AbortSignal,
            {
                shareId,
                linkIds,
                query,
                maxParallelRequests = MAX_THREADS_PER_REQUEST,
                batchRequestSize = BATCH_REQUEST_SIZE,
                request = debouncedRequest,
                allowedCodes = [],
            }: {
                shareId: string;
                linkIds: string[];
                query: (batchLinkIds: string[], shareId: string) => Promise<any> | any;
                maxParallelRequests?: number;
                batchRequestSize?: number;
                request?: <T>(args: object, abortSignal?: AbortSignal) => Promise<T>;
                allowedCodes?: number[];
            }
        ) => {
            const responses: { batchLinkIds: string[]; response: T }[] = [];
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const batches = chunk(linkIds, batchRequestSize);

            const queue = await Promise.all(
                batches.map(
                    (batchLinkIds) => async () =>
                        request<T>(await query(batchLinkIds, shareId), abortSignal)
                            .then((response) => {
                                responses.push({ batchLinkIds, response });
                                response.Responses.forEach(({ LinkID, Response }) => {
                                    if (
                                        Response.Code === API_CODES.SINGLE_SUCCESS ||
                                        allowedCodes.includes(Response.Code)
                                    ) {
                                        successes.push(LinkID);
                                    } else {
                                        failures[LinkID] = Response.Error;
                                    }
                                });
                            })
                            .catch((error) => {
                                batchLinkIds.forEach((linkId) => (failures[linkId] = error));
                            })
                )
            );
            await preventLeave(runInQueue(queue, maxParallelRequests));

            return {
                responses,
                successes,
                failures,
            };
        },
        [debouncedRequest, preventLeave]
    );

    return batchHelper;
};
