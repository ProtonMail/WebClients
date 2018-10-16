import { API_CUSTOM_ERROR_CODES } from '../../errors';

const {
    APP_VERSION_BAD,
    API_VERSION_INVALID,
    API_VERSION_BAD,
    API_OFFLINE,
    HUMAN_VERIFICATION_REQUIRED
} = API_CUSTOM_ERROR_CODES;

/* @ngInject */
function authHttpResponseInterceptor($q, $injector, AppModel, networkUtils) {
    let notification;
    let NOTIFS;

    const buildNotifs = () => {
        const gettextCatalog = $injector.get('gettextCatalog');
        return {
            newVersion: gettextCatalog.getString(
                'A new version of ProtonMail is available. Please refresh this page.',
                null,
                'Info'
            ),
            nonIntegerVersion: gettextCatalog.getString('Non-integer API version requested.', null, 'Error'),
            unsupported: gettextCatalog.getString('Unsupported API version.', null, 'Error'),
            offline: gettextCatalog.getString('The ProtonMail API is offline: ', null, 'Error'),
            noInternet: gettextCatalog.getString('No Internet connection found.', null, 'Error'),
            noServer: gettextCatalog.getString('Could not connect to server.', null, 'Error'),
            timeout: gettextCatalog.getString('Request timed out, please try again.', null, 'Error'),
            noReachProton: gettextCatalog.getString(
                'ProtonMail cannot be reached right now, please try again later.',
                null,
                'Error'
            )
        };
    };

    const notifyError = (error, message) => {
        // Disable the notification. Used for the SRP because we don't want to refactor it now.
        if (error.config && error.config.noNotify) {
            return;
        }
        // Set no notify for the network activity tracker to not display errors twice.
        error.noNotify = true;
        $injector.get('notification').error(message);
    };

    const closeNotification = () => {
        if (!notification) {
            return;
        }
        notification.close();
        notification = undefined;
    };

    /**
     * Handle custom API errors.
     * Returns a new promise if the rejection should be overriden.
     * @param {Error} error
     * @returns {Promise | undefined}
     */
    const handleCustomError = (error) => {
        if (!error || !error.data) {
            return;
        }

        const { data, config = {} } = error;

        if (!data || !data.Code) {
            return;
        }

        const { Error: errorMessage, Code: errorCode } = data;

        // Show the API error only - pending decision to be taken for how to handle it.
        if (errorCode === APP_VERSION_BAD) {
            return notifyError(error, Error);
        }

        if (errorCode === API_VERSION_INVALID) {
            return notifyError(error, NOTIFS.nonIntegerVersion);
        }

        if (errorCode === API_VERSION_BAD) {
            return notifyError(error, NOTIFS.unsupported);
        }

        if (errorCode === API_OFFLINE) {
            return notifyError(error, NOTIFS.offline + Error);
        }

        if (errorCode === HUMAN_VERIFICATION_REQUIRED) {
            const handle9001 = $injector.get('handle9001');
            return handle9001(error.config);
        }

        if (Array.isArray(config.suppress) && config.suppress.includes(errorCode)) {
            return;
        }

        /**
         * Otherwise, if we received any error, display it.
         */
        if (errorMessage) {
            notifyError(error, errorMessage);
        }
    };

    /**
     * Handle API status code errors.
     * Returns a new promise if the rejection should be overriden.
     * @param {Error} error
     * @returns {Promise | undefined}
     */
    const handleHttpStatus = (error) => {
        if (!error || !error.status) {
            return;
        }

        const { status, config } = error;

        if (status === 401) {
            const handle401 = $injector.get('handle401');
            return handle401(error);
        }

        if (status === 403) {
            const unlockUser = $injector.get('unlockUser');
            const $http = $injector.get('$http');
            return unlockUser().then(() => $http(config));
        }

        if (status === 504) {
            notification = notifyError(error, NOTIFS.timeout);
            return AppModel.set('requestTimeout', true);
        }

        if ([408, 503].indexOf(error.status) > -1) {
            notification = notifyError(error, NOTIFS.noReachProton);
        }
    };

    /**
     * Handle offline error codes.
     * @param {Error} error
     * @returns {Promise | undefined}
     */
    const handleOfflineError = (error) => {
        if (!error) {
            return;
        }

        if (networkUtils.isCancelledRequest(error)) {
            return;
        }

        const { status, config = {} } = error;

        if (status !== 0 && status !== -1) {
            return;
        }

        const handleTryAgain = $injector.get('handleTryAgain');
        const tryAgainModel = $injector.get('tryAgainModel');

        const { url, noOfflineNotify } = config;

        // Did we retry again?
        if (tryAgainModel.check(url)) {
            const key = navigator.onLine === true ? 'noServer' : 'noInternet';

            // Some API calls show a custom error notification on offline, like the event manager.
            if (!noOfflineNotify) {
                notifyError(error, NOTIFS[key]);
            }

            AppModel.set('onLine', false);
        }

        return handleTryAgain(error);
    };

    return {
        response(response) {
            closeNotification();

            if (/^(?!.*templates)/.test(response.config.url)) {
                AppModel.set('onLine', true);
            }

            return response || $q.when(response);
        },
        responseError(error) {
            closeNotification();

            !NOTIFS && (NOTIFS = buildNotifs());

            const offlineOverride = handleOfflineError(error);
            if (offlineOverride) {
                return offlineOverride;
            }

            const httpStatusOverride = handleHttpStatus(error);
            if (httpStatusOverride) {
                return httpStatusOverride;
            }

            const customOverride = handleCustomError(error);
            if (customOverride) {
                return customOverride;
            }

            return $q.reject(error);
        }
    };
}

export default authHttpResponseInterceptor;
