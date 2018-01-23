import _ from 'lodash';

/* @ngInject */
function mailSettingsModel($rootScope) {
    let CACHE = {};
    const get = (key = 'all') => angular.copy(key === 'all' ? CACHE : CACHE[key]);
    const clear = () => (CACHE = {});
    const set = (key = 'all', value) => {
        if (key === 'all') {
            _.extend(CACHE, value);
        } else {
            CACHE[key] = value;
        }

        $rootScope.$emit('mailSettings', { type: 'updated', data: { key, value } });
    };

    $rootScope.$on('logout', () => clear());

    return { get, set };
}
export default mailSettingsModel;
