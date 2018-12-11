import { decryptPrivateKey, getFingerprint, getKeys } from 'pmcrypto';

/* @ngInject */
function decryptImportKeyModal(pmModal, notification, gettextCatalog) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/decryptImportKey.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const self = this;
            self.password = '';
            const privateKey = params.privateKey;

            getKeys(params.privateKey).then(([key]) => {
                $scope.$applyAsync(() => {
                    self.fingerprint = getFingerprint(key).substring(0, 8);
                });
            });

            setTimeout(() => document.getElementById('password').focus(), 100);

            self.submit = () => {
                decryptPrivateKey(privateKey, self.password)
                    .then((decryptedKey) => {
                        params.submit(decryptedKey);
                    })
                    .catch(() => {
                        notification.error(gettextCatalog.getString('Incorrect decryption password', null, 'Error'));
                    });
            };

            self.cancel = () => {
                params.cancel();
            };
        }
    });
}
export default decryptImportKeyModal;
