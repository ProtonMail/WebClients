import type { ScopeContext } from '@sentry/types';

import { EnrichedError } from './EnrichedError';
import { ERROR_REQUIRE_PAGE_REFRESH } from './errorStrings';

/**
 * Creates a `WebpackChunkFailedToLoad` error object with a specific message and additional information.
 *
 * @param {Error} e - The underlying error that caused the chunk to fail loading.
 * @param {string} chunkName - The name of the chunk that failed to load.
 * @returns {WebpackChunkFailedToLoad} A new instance of `WebpackChunkFailedToLoad` with the specified message and additional information.
 *
 * @see WebpackChunkFailedToLoad
 *
 * @example
 *
 * import('./module').catch(() => Promise.reject(getWebpackChunkFailedToLoadError(e, 'my-chunk-name')));
 */

export const getWebpackChunkFailedToLoadError = (e: Error, chunkName: string) =>
    new WebpackChunkFailedToLoad(ERROR_REQUIRE_PAGE_REFRESH, {
        tags: {
            chunkName,
        },
        extra: {
            e,
        },
    });

/**
 * This error denotes to the user they should refresh their page.
 * This should be chained to any webpack imports.
 *
 * You should use `getWebpackChunkFailedToLoadError` to build a WebpackChunkFailedToLoad EnrichedError.
 *
 */
export class WebpackChunkFailedToLoad extends EnrichedError {
    constructor(message: string, context: Partial<ScopeContext>) {
        super(message, context);
        this.name = 'WebpackChunkFailedToLoad';
    }
}
