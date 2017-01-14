angular.module('proton.organization')
.factory('organizationKeysModel', (organizationApi) => {
    let keys = {};
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
