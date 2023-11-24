import { c } from 'ttag';

import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

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
export const getRefreshError = () =>
    new RefreshError(c('Error').t`${DRIVE_APP_NAME} has updated. Please refresh the page.`);

/**
 * This error denotes to the user they should refresh their page.
 * This should be chained to `import()`, `new Worker()` or `serviceWorker.register`.
 *
 * You should use `getRefreshError` to build a Refresh Error.
 *
 * If you are in a context where ttag is not available (worker), you can use this constructor directly
 * and rebuild it on the main thread.
 */
export class RefreshError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RefreshError';
    }
}
