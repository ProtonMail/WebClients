import { VERSION_INFO } from '../../constants';
import CONFIG from '../../config';

/* @ngInject */
function versionInfoModel($http, AppModel, dispatchers) {
    const { on } = dispatchers();
    const STATE = {};

    /**
     * Check if the version differs. Supports both downgrades and upgrades.
     * @param {String} versionA
     * @param {String} versionB
     * @returns {boolean}
     */
    const isDifferent = (versionA, versionB) => !!versionA && versionB !== versionA;

    const stopInterval = () => {
        clearInterval(STATE.intervalHandle);
        delete STATE.intervalHandle;
    };

    const poll = async () => {
        const { data: { version } = {} } = await $http.get(CONFIG.versionPath);

        if (!isDifferent(version, CONFIG.app_version)) {
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
