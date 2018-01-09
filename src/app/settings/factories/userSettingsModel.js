/* @ngInject */
function userSettingsModel($rootScope) {
    let CACHE = {};
    const get = (key = 'all') => angular.copy(key === 'all' ? CACHE : CACHE[key]);
    const clear = () => (CACHE = {});
    const set = (key = 'all', value) => {
        if (key === 'all') {
            _.extend(CACHE, value);
        } else {
            CACHE[key] = value;
        }

        $rootScope.$emit('userSettings', { type: 'updated', data: get() });
    };

    $rootScope.$on('logout', () => clear());

    return { get, set };
}
export default userSettingsModel;
