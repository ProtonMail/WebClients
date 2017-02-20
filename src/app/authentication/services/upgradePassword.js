angular.module('proton.authentication')
.factory('upgradePassword', (settingsApi, tempStorage) => {
    const key = 'auth';
    const tenMinutes = 10 * 60 * 1000; // 10 minutes
    /**
     * Store standard Auth object
     * @param {Object} value - Auth object
     */
    function store(value) {
        tempStorage.setItem(key, value, tenMinutes);
    }
    /**
     * Send upgrade credentials
     * @return {Promise}
     */
    function send() {
        const Auth = tempStorage.getItem(key);
        if (Auth) {
            tempStorage.removeItem(key);
            return settingsApi.passwordUpgrade(Auth);
        }
        return Promise.resolve();
    }
    return { store, send };
});
