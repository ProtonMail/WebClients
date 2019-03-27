import { API_CUSTOM_ERROR_CODES } from '../../errors';

const {
    APP_VERSION_BAD,
    API_VERSION_INVALID,
    API_VERSION_BAD,
    API_OFFLINE,
    HUMAN_VERIFICATION_REQUIRED,
    AUTH_AUTH_ACCOUNT_DISABLED
} = API_CUSTOM_ERROR_CODES;

/* @ngInject */
function httpInterceptor($q, $injector, AppModel, networkUtils) {
    const STATE = {};

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

    /**
     * Notify an error and set noNotify on the error.
     * @param {Object} error - The http rejection from $http
     * @param {String} message - The string to show
     * @param {Object} [options] - Options object to pass to notify
     */
    const notifyError = (error, message, options) => {
        // Disable the notification. Used for the SRP because we don't want to refactor it now.
        if (error.config && error.config.noNotify) {
            return;
        }
        // Set no notify for the network activity tracker to not display errors twice.
        error.noNotify = true;
        $injector.get('notification').error(message, options);
    };

    const closeNotification = () => {
        if (!STATE.notification) {
            return;
        }
        STATE.notification.close();
        delete STATE.notification;
    };

    /**
     * Handle custom API errors.
     * Returns a new promise if the rejection should be overriden.
     * @param {Object} error - The http rejection from $http
     * @returns {Promise | void}
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
            STATE.appVersionBad = true;

            $injector.get('notification').closeAll();
            $injector.get('notification').disableClose();

            return notifyError(error, errorMessage, {
                templateUrl: require('../../../templates/notifications/badVersion.tpl.html'),
                duration: '0'
            });
        }

        if (errorCode === API_VERSION_INVALID) {
            return notifyError(error, STATE.NOTIFS.nonIntegerVersion);
        }

        if (errorCode === API_VERSION_BAD) {
            return notifyError(error, STATE.NOTIFS.unsupported);
        }

        if (errorCode === API_OFFLINE) {
            return notifyError(error, STATE.NOTIFS.offline + errorMessage);
        }

        if (errorCode === HUMAN_VERIFICATION_REQUIRED) {
            const handle9001 = $injector.get('handle9001');
            return handle9001(error.config);
        }

        if (errorCode === AUTH_AUTH_ACCOUNT_DISABLED) {
            const handle10003 = $injector.get('handle10003');
            return handle10003();
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
     * @param {Object} error - The http rejection from $http
     * @returns {Promise | undefined}
     */
    const handleHttpStatus = (error) => {
        if (!error || !error.status) {
            return;
        }

        const { status, config } = error;

        if (status === 401) {
            const handle401 = $injector.get('handle401');
            return handle401(error).catch((error) => {
                // Special handling to notify the "Invalid access token" error from the API
                handleCustomError(error);
                return $q.reject(error);
            });
        }

        if (status === 403) {
            const unlockUser = $injector.get('unlockUser');
            const $http = $injector.get('$http');
            return unlockUser().then(() => $http(config));
        }

        if (status === 429) {
            const handle429 = $injector.get('handle429');
            return handle429(error);
        }

        if (status === 504) {
            STATE.notification = notifyError(error, STATE.NOTIFS.timeout);
            return AppModel.set('requestTimeout', true);
        }

        if ([408, 503].indexOf(error.status) > -1) {
            STATE.notification = notifyError(error, STATE.NOTIFS.noReachProton);
        }
    };

    /**
     * Handle offline error codes.
     * @param {Object} error - The http rejection from $http
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
                notifyError(error, STATE.NOTIFS[key]);
            }

            AppModel.set('onLine', false);
        }

        return handleTryAgain(error);
    };

    /**
     * Check if the path begins with templates or assets.
     * It should always end with a slash and may optionally begin with one.
     * @param {String} url
     * @returns {boolean}
     */
    const isTemplateOrAssets = (url) => /^\/?(templates|assets)\//.test(url);

    return {
        request(config) {
            // If the client has received app version bad from the client, silently reject all requests to prevent them being sent to the API.
            if (STATE.appVersionBad && !isTemplateOrAssets(config.url)) {
                return $q.reject({ noNotify: true, config, status: -2 });
            }

            return config;
        },
        response(response) {
            closeNotification();

            if (!isTemplateOrAssets(response.config.url)) {
                AppModel.set('onLine', true);
            }

            return response || $q.when(response);
        },
        responseError(error) {
            closeNotification();

            !STATE.NOTIFS && (STATE.NOTIFS = buildNotifs());

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

export default httpInterceptor;
