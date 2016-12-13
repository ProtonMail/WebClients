angular.module('proton.authentication')
.factory('upgradePassword', (Setting, tempStorage) => {
    const key = 'auth';
    function store(value) {
        const lifetime = 10 * 60 * 1000;
        tempStorage.setItem(key, value, lifetime);
    }
    function send() {
        const Auth = tempStorage.getItem(key);
        const params = { Auth };
        const creds = tempStorage.getItem('creds');

        if (Auth) {
            tempStorage.removeItem(key);
            return Setting.passwordUpgrade(params, creds);
        }
    }

    return { store, send };
});
