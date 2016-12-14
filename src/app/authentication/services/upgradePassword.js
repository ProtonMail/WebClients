angular.module('proton.authentication')
.factory('upgradePassword', (Setting, tempStorage) => {
    const key = 'auth';
    /**
     * Store standard Auth object
     */
    function store(value) {
        const lifetime = 10 * 60 * 1000;
        tempStorage.setItem(key, value, lifetime);
    }
    /**
     * Send upgrade credentials
     */
    function send() {
        const Auth = tempStorage.getItem(key);

        if (Auth) {
            tempStorage.removeItem(key);
            return Setting.passwordUpgrade({ Auth });
        }
        return Promise.resolve()
    }
    return { store, send };
});
