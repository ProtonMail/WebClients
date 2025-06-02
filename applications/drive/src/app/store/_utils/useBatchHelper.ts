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
     *   @param {string[]} options.linkIds - Array of link IDs to process
     *   @param {Function} options.query - Function that generates the API request for a batch of link IDs
     *   @param {number} [options.maxParallelRequests] - Maximum number of parallel requests
     *   @param {number} [options.batchRequestSize] - Maximum number of links per batch
     *   @param {Function} [options.request] - Custom request function to use instead of the default (used for public request)
     *   @param {number[]} [options.allowedCodes] - Array of response codes to consider as successful besides 1000
     *   @param {number[]} [options.ignoredCodes] - Array of response codes to ignore (not considered neither as error nor success)
     *   @returns {Promise<{responses: Array, successes: string[], failures: Object}>}
     */
    const batchAPIHelper = useCallback(
        async <T extends { Responses: { LinkID: string; Response: { Code: number; Error?: string } }[] }>(
            abortSignal: AbortSignal,
            {
                linkIds,
                query,
                maxParallelRequests = MAX_THREADS_PER_REQUEST,
                batchRequestSize = BATCH_REQUEST_SIZE,
                request = debouncedRequest,
                allowedCodes = [],
                ignoredCodes = [],
            }: {
                linkIds: string[];
                query: (batchLinkIds: string[]) => Promise<object> | object | undefined;
                maxParallelRequests?: number;
                batchRequestSize?: number;
                request?: <T>(args: object, abortSignal?: AbortSignal) => Promise<T>;
                allowedCodes?: number[];
                ignoredCodes?: number[];
            }
        ) => {
            const responses: { batchLinkIds: string[]; response: T }[] = [];
            const successes: string[] = [];
            const failures: { [linkId: string]: string | undefined } = {};

            const batches = chunk(linkIds, batchRequestSize);

            const queue = await Promise.all(
                batches.map((batchLinkIds) => async () => {
                    const q = await query(batchLinkIds);
                    if (!q) {
                        return;
                    }

                    await request<T>(q, abortSignal)
                        .then((response) => {
                            responses.push({ batchLinkIds, response });
                            response.Responses.forEach(({ LinkID, Response }) => {
                                if (ignoredCodes.includes(Response.Code)) {
                                    return;
                                }
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
                        });
                })
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

    /**
     * Executes an array of promise-returning functions in batches of a specified size
     * to control concurrency and prevent overwhelming resources.
     *
     * @param items - Array of items to process
     * @param processFn - Function that takes an item and returns a promise with the processed result
     * @param batchSize - Number of promises to process concurrently (default is 10)
     * @param abortSignal - Optional AbortSignal to cancel the operation
     * @returns Promise that resolves with an array of all processed results
     */
    async function batchPromiseHelper<T, R>(
        items: T[],
        processFn: (item: T, index: number) => Promise<R>,
        batchSize: number = 10,
        abortSignal?: AbortSignal
    ): Promise<R[]> {
        const results: R[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            if (abortSignal?.aborted) {
                throw new DOMException('The operation was aborted', 'AbortError');
            }

            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((item, batchIndex) => processFn(item, i + batchIndex)));

            results.push(...batchResults);
        }

        return results;
    }

    return {
        batchAPIHelper,
        batchPromiseHelper,
    };
};
