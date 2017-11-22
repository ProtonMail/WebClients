angular.module('proton.core')
    .factory('$exceptionHandler', ($injector) => {
        let nReports = 0;

        // We don't need to log this error as it's more a status
        const MAP_ERROR_SILENT = {
            'loginPassword:cancel': true
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
                    return $injector.get('bugReportApi').crash(error);
                } catch (e) {
                // Do nothing
                    console.error(e);
                }
            }

            return Promise.resolve();
        };
    });
