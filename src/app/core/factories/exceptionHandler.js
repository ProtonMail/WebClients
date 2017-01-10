angular.module('proton.core')
.factory('$exceptionHandler', ($log, $injector, CONFIG, CONSTANTS) => {
    let nReports = 0;

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

    return function (exception) {
        nReports++;

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
                const { user = {} } = $injector.get('authentication') || {};
                const crashData = {
                    OS: tools.getOs(),
                    OSVersion: '',
                    Browser: tools.getBrowser(),
                    BrowserVersion: tools.getBrowserVersion(),
                    Client: 'Angular',
                    ClientVersion: CONFIG.app_version,
                    ViewLayout: getViewLayout(user),
                    ViewMode: tools.typeList(),
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
