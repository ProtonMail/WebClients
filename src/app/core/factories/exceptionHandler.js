angular.module('proton.core')
    .factory('$exceptionHandler', ($log, $injector, CONFIG, CONSTANTS) => {
        let nReports = 0;

        // We don't need to log this error as it's more a status
        const MAP_ERROR_SILENT = {
            'loginPassword:cancel': true
        };

        const getViewLayout = ({ ViewLayout }) => {
            let key;
            switch (ViewLayout) {
                case CONSTANTS.ROW_MODE:
                    key = 'row';
                    break;
                case CONSTANTS.COLUMN_MODE:
                    key = 'column';
                    break;
                default:
                    key = 'unknown';
                    break;
            }
            return key;
        };

        const getViewMode = ({ ViewMode }) => {
            let key;
            switch (ViewMode) {
                case CONSTANTS.MESSAGE_VIEW_MODE:
                    key = 'row';
                    break;
                case CONSTANTS.CONVERSATION_VIEW_MODE:
                    key = 'column';
                    break;
                default:
                    key = 'undefined';
                    break;
            }
            return key;
        };

        const getError = (exception) => {
            if (exception instanceof Error) {
                return { message: exception.message, stack: exception.stack };
            }

            if (angular.isString(exception)) {
                return exception;
            }
            try {
                const json = angular.toJson(exception);
                if ($.isEmptyObject(json)) {
                    return exception.toString();
                }
                return exception;
            } catch (err) {
                return err.message;
            }
        };

        const isLoggable = (err) => {
            return !(MAP_ERROR_SILENT[err] || MAP_ERROR_SILENT[(err || {}).message]);
        };

        return function (exception) {
            nReports++;

            /**
             * Override Angular internal service, DO NOT REMOVE THIS CONSOLE.
             * (ಠ益ಠ)
             */
            console.error(exception);

            if (nReports < 6) {
                const error = getError(exception);

                if (!isLoggable(error)) {
                    return Promise.resolve();
                }

                try {
                    const Bug = $injector.get('Bug');
                    const aboutClient = $injector.get('aboutClient');
                    const $state = $injector.get('$state');
                    const { user = {} } = $injector.get('authentication') || {};
                    const crashData = {
                        OS: aboutClient.getOS(),
                        OSVersion: '',
                        Browser: aboutClient.getBrowser(),
                        BrowserVersion: aboutClient.getBrowserVersion(),
                        Client: 'Angular',
                        ClientVersion: CONFIG.app_version,
                        ViewLayout: getViewLayout(user),
                        ViewMode: getViewMode(user),
                        Debug: { state: $state.$current.name, error }
                    };
                    return Bug.crash(crashData).catch(angular.noop);
                } catch (e) {
                // Do nothing
                    console.error(e);
                }
            }

            return Promise.resolve();
        };
    });
