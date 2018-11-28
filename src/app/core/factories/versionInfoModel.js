import { VERSION_INFO } from '../../constants';
import CONFIG from '../../config';

/* @ngInject */
function versionInfoModel($http, AppModel, dispatchers) {
    const { on } = dispatchers();
    const STATE = {};

    /**
     * Check if the string differs if `a` exists.
     * @param {String} a
     * @param {String} b
     * @returns {boolean}
     */
    const isDifferent = (a, b) => !!a && b !== a;

    const stopInterval = () => {
        clearInterval(STATE.intervalHandle);
        delete STATE.intervalHandle;
    };

    const poll = async () => {
        const { data: { version, commit } = {} } = await $http.get(CONFIG.versionPath);

        if (!isDifferent(commit, CONFIG.commit)) {
            return;
        }

        AppModel.set('newVersion', version);

        // No need to keep checking.
        stopInterval();
    };

    const init = () => {
        clearInterval(STATE.intervalHandle);
        STATE.intervalHandle = setInterval(poll, VERSION_INFO.INTERVAL);
        poll();
    };

    on('logout', stopInterval);

    return init;
}

export default versionInfoModel;
