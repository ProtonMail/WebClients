import { PASSWORD_WRONG_ERROR, setRefreshCookies } from '../auth';
import { createOnceHandler, STATUS_CODE_UNAUTHORIZED, STATUS_CODE_UNLOCK } from '../../apiHandlers';

export const LogoutError = () => {
    const error = new Error('Logout');
    error.name = 'LogoutError';
    return error;
};

/**
 * Attach a catch handler to every API call to handle 401, 403, and other errors.
 * @param {function} call
 * @param {function} handleUnlock
 * @param {function} handleError
 * @param {function} handleLogout
 * @return {function}
 */
export default ({ call, handleUnlock, handleError, handleLogout }) => {
    let loggedOut = false;

    /**
     * Handle refresh token. Happens when the access token has expired.
     * Multiple calls can fail, so this ensures the refresh route is called once.
     */
    const refresh = () => call(setRefreshCookies());
    const refreshHandler = createOnceHandler(refresh, () => {
        loggedOut = true;
        handleLogout();
    });

    /**
     * Handle unlock user.
     */
    const unlock = () => {
        return handleUnlock().catch((e) => {
            if (e.data && e.data.Code === PASSWORD_WRONG_ERROR) {
                return unlock();
            }
            throw e;
        });
    };
    const unlockHandler = createOnceHandler(unlock);

    return (options) => {
        // Don't allow any more calls when logged out. Have to create a new instance.
        if (loggedOut) {
            throw new LogoutError();
        }

        return call(options).catch((e) => {
            if (loggedOut) {
                throw new LogoutError();
            }

            const { status } = e;

            const retry = () => {
                return call(options).catch((retryError) => {
                    return handleError(retryError);
                });
            };

            if (status === STATUS_CODE_UNAUTHORIZED) {
                return refreshHandler().then(retry);
            }

            if (status === STATUS_CODE_UNLOCK) {
                return unlockHandler().then(retry);
            }

            return handleError(e);
        });
    };
};
