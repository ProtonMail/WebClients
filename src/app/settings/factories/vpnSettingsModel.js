import _ from 'lodash';

/* @ngInject */
function vpnSettingsModel(dispatchers) {
    const { on, dispatcher } = dispatchers(['vpnSettings']);

    let CACHE = {};
    const get = (key = 'all') => angular.copy(key === 'all' ? CACHE : CACHE[key]);
    const clear = () => (CACHE = {});
    const set = (key = 'all', value) => {
        if (key === 'all') {
            _.extend(CACHE, value);
        } else {
            CACHE[key] = value;
        }

        dispatcher.vpnSettings('updated', get());
    };

    on('logout', clear);

    return { get, set };
}
export default vpnSettingsModel;
