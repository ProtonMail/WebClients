import { ERROR_REQUIRE_PAGE_REFRESH } from './errorStrings';

export const isRefreshError = (err: any): err is RefreshError => {
    return err.name === 'RefreshError';
};

/**
 * Builds a localized `RefreshError`. Useful to let the user know they should refresh the page.
 *
 * @see RefreshError
 *
 * @example
 *
 * import('./module').catch(() => Promise.reject(getRefreshError()));
 */
export const getRefreshError = () => new RefreshError(ERROR_REQUIRE_PAGE_REFRESH);

const REFRESH_MESSAGE = 'Please refresh the page.';

/**
 * This error denotes to the user they should refresh their page.
 * This should be chained to `import()`, `new Worker()` or `serviceWorker.register`.
 *
 * You should use `getRefreshError` to build a Refresh Error.
 *
 * If you are in a context where ttag is not available (i.e. worker), you can use this
 * constructor directly and rebuild it on the main thread for localization.
 */
export class RefreshError extends Error {
    sentryMessage: string = REFRESH_MESSAGE;

    constructor(message?: string) {
        super(message || REFRESH_MESSAGE);
        this.name = 'RefreshError';
    }
}
