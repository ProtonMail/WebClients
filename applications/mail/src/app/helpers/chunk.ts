import { Api } from '@proton/shared/lib/interfaces';
import chunk from '@proton/utils/chunk';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_ACTION_DEFAULT_CHUNK_SIZE } from 'proton-mail/constants';

/**
 * Takes an api action and split it in several requests to have smaller actions on the api side
 * By default, split on 25 elements.
 * If there is an "Undo" on the request use "runParallelUndoableChunkedActions" instead
 */
export const runParallelChunkedActions = ({
    api,
    items,
    chunkSize,
    action,
}: {
    api: Api;
    items: any[];
    chunkSize?: number;
    action: (chunkedItem: any) => any;
}) => {
    const chunks = chunk(items, chunkSize || MAIL_ACTION_DEFAULT_CHUNK_SIZE);

    return Promise.allSettled(
        chunks.map(async (chunk) => {
            try {
                await api(action(chunk));
            } catch (error: any) {
                throw error;
            }
        })
    );
};

/**
 * Takes an api action and split it in several requests to have smaller actions on the api side
 * By default, split on 25 elements.
 * If there is no "Undo" on the request use "runParallelChunkedActions" instead
 */
export const runParallelUndoableChunkedActions = ({
    api,
    items,
    chunkSize,
    action,
    canUndo = true,
}: {
    api: Api;
    items: any[];
    chunkSize?: number;
    action: (chunkedItem: any) => any;
    canUndo?: boolean;
}) => {
    const chunks = chunk(items, chunkSize || MAIL_ACTION_DEFAULT_CHUNK_SIZE);

    return Promise.allSettled(
        chunks.map(async (chunk) => {
            try {
                const { UndoToken } = await api<{ UndoToken: { Token: string } }>(action(chunk));
                if (canUndo) {
                    return UndoToken.Token;
                }
            } catch (error: any) {
                throw error;
            }
        })
    );
};

export const getFilteredUndoTokens = (tokens: PromiseSettledResult<string | undefined>[]) => {
    return tokens.reduce<string[]>((acc, result) => {
        if (result.status === 'fulfilled' && isTruthy(result.value)) {
            acc.push(result.value);
        }
        return acc;
    }, []);
};
