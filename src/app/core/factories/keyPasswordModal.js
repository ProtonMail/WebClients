angular.module('proton.core')
.factory('keyPasswordModal', (pmModal, pmcw, notify, gettextCatalog, passwords, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/keyPassword.tpl.html',
        controller(params) {
            const self = this;
            self.passwordMode = authentication.user.PasswordMode;
            self.password = '';
            const privateKey = params.privateKey;

            setTimeout(() => document.getElementById('password').focus(), 100);

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
