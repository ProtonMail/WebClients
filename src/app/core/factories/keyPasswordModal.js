angular.module('proton.core')
.factory('keyPasswordModal', ($timeout, pmModal, pmcw, notify, gettextCatalog, passwords) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/keyPassword.tpl.html',
        controller(params) {
            const self = this;
            self.password = '';
            const privateKey = params.privateKey;

            $timeout(() => document.getElementById('password').focus());

            self.submit = () => {

                passwords.computeKeyPassword(self.password, params.salt)
                .then((keyPassword) => pmcw.decryptPrivateKey(privateKey, keyPassword))
                .then((decryptedKey) => {
                    params.submit(decryptedKey);
                }, () => {
                    notify({ message: gettextCatalog.getString('Incorrect decryption password', null, 'Error'), classes: 'notification-danger' });
                });
            };

            self.cancel = () => {
                params.cancel();
            };
        }
    });
});
