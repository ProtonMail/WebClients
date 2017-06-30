angular.module('proton.organization')
.factory('organizationKeysModel', (organizationApi, $rootScope) => {

    let keys = {};
    const ALLOWED_STATES = ['signatures', 'domains', 'members'].map((n) => `secured.${n}`);


    $rootScope.$on('$stateChangeStart', (e, state) => {
        if (ALLOWED_STATES.indexOf(state.name) === -1) {
            clear();
        }
    });

    function get() {
        return keys;
    }

    function fetch() {
        return organizationApi.getKeys()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                keys.PublicKey = data.PublicKey;
                keys.PrivateKey = data.PrivateKey;
                return data;
            }
            throw new Error(data.Error || 'Organization keys request failed');
        });
    }
    function clear() {
        keys = {};
    }
    return { fetch, get, clear };
});
