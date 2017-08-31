angular.module('proton.keys')
    .factory('keyPasswordModal', (pmModal, pmcw, notification, gettextCatalog, passwords, authentication) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/keyPassword.tpl.html',
            /* @ngInject */
            controller: function (params) {
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
                            notification.error(gettextCatalog.getString('Incorrect decryption password', null, 'Error'));
                        });
                };

                self.cancel = () => {
                    params.cancel();
                };
            }
        });
    });
