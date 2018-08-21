import _ from 'lodash';

/* @ngInject */
function mailSettingsModel(dispatchers) {
    const { on, dispatcher } = dispatchers(['mailSettings']);

    let CACHE = {};
    const get = (key = 'all') => angular.copy(key === 'all' ? CACHE : CACHE[key]);
    const clear = () => (CACHE = {});
    const draftsIncluded = () => CACHE.ShowMoved & 1;
    const sentIncluded = () => CACHE.ShowMoved & 2;
    const set = (key = 'all', value) => {
        if (key === 'all') {
            _.extend(CACHE, value);
        } else {
            CACHE[key] = value;
        }

        dispatcher.mailSettings('updated', { key, value });
    };

    on('logout', clear);

    return { get, set, draftsIncluded, sentIncluded };
}
export default mailSettingsModel;
