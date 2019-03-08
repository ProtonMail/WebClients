/* @ngInject */
function upgradePassword(settingsApi, tempStorage) {
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
        const credentials = tempStorage.getItem(key);
        if (credentials) {
            tempStorage.removeItem(key);
            return settingsApi.passwordUpgrade(credentials);
        }
        return Promise.resolve();
    }
    return { store, send };
}
export default upgradePassword;
