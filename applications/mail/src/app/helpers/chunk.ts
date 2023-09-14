import { c } from 'ttag';

import { Api } from '@proton/shared/lib/interfaces';
import chunk from '@proton/utils/chunk';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_ACTION_DEFAULT_CHUNK_SIZE } from 'proton-mail/constants';

/**
 * Takes an api action and split it in several requests to have smaller actions on the api side
 * By default, split on 25 elements.
 * Also, if one of the request fails, an error will be thrown with UndoTokens of the request which did work.
 * It allows us to Undo all the requests and rollback optimistically the UI for the user.
 *
 * However, if the request does not return UndoToken, optimisticAction needs to be used.
 * It allows to rollback optimistically the UI only on the request which did fail.
 * In that case, request that passed and the ones that failed will be reflected on the UI.
 */
export const runParallelChunkedActions = async ({
    api,
    items,
    chunkSize,
    action,
    canUndo = true,
    optimisticAction,
}: {
    api: Api;
    items: any[];
    chunkSize?: number;
    action: (chunkedItem: any) => any;
    canUndo?: boolean;
    optimisticAction?: (items: any) => any;
}) => {
    const chunks = chunk(items, chunkSize || MAIL_ACTION_DEFAULT_CHUNK_SIZE);

    // Store failed chunks in case we need to rollback them
    const rollbacks: (() => any)[] = [];

    const tokens = await Promise.allSettled(
        chunks.map(async (chunk) => {
            let rollback;
            try {
                // For requests that we cannot undo, we first need to apply the optimistic action.
                if (optimisticAction) {
                    rollback = optimisticAction(chunk);
                }

                // Do the action on the chunk
                const res = await api<{ UndoToken: { Token: string } }>({ ...action(chunk), silence: true });

                // If we can undo the request, return the Undo token
                if (canUndo) {
                    const { UndoToken } = res;
                    return UndoToken.Token;
                }
            } catch (error: any) {
                // If an error happened, store the "rollback" function of the current chunk
                if (rollback) {
                    rollbacks.push(rollback);
                }
                throw error;
            }
        })
    );

    // Throw an error if one of the chunked request has failed
    const isPartialFail = tokens.some((res) => res.status === 'rejected');

    if (isPartialFail) {
        // If the request cannot be undone, and some of them failed, undo all the optimistic updates done
        if (optimisticAction) {
            rollbacks.forEach((rollback) => rollback());
        }
        const newError = new Error(c('Error').t`Something went wrong. Please try again.`);
        Object.assign(newError, { data: tokens });
        throw newError;
    }

    return tokens;
};

export const getFilteredUndoTokens = (tokens: PromiseSettledResult<string | undefined>[]) => {
    return tokens.reduce<string[]>((acc, result) => {
        if (result.status === 'fulfilled' && isTruthy(result.value)) {
            acc.push(result.value);
        }
        return acc;
    }, []);
};
