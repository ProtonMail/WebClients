angular.module('proton.core')
.factory('$exceptionHandler', ($log, $injector, CONFIG) => {
    let nReports = 0;
    return function (exception) {
        nReports++;
        $log.error(exception);

        if (nReports < 6) {
            let debug;
            if (exception instanceof Error) {
                debug = { message: exception.message, stack: exception.stack };
            } else if (angular.isString(exception)) {
                debug = exception;
            } else {
                try {
                    const json = angular.toJson(exception);
                    if ($.isEmptyObject(json)) {
                        debug = exception.toString();
                    } else {
                        debug = exception;
                    }
                } catch (err) {
                    debug = err.message;
                }
            }

            try {
                const Bug = $injector.get('Bug');
                const tools = $injector.get('tools');
                const $state = $injector.get('$state');
                const crashData = {
                    OS: tools.getOs(),
                    OSVersion: '',
                    Browser: tools.getBrowser(),
                    BrowserVersion: tools.getBrowserVersion(),
                    Client: 'Angular',
                    ClientVersion: CONFIG.app_version,
                    Debug: { state: $state.$current.name, error: debug }
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
