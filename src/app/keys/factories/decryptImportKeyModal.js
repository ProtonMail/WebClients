/* @ngInject */
function decryptImportKeyModal(pmModal, notification, pmcw, gettextCatalog) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/decryptImportKey.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            self.password = '';
            const privateKey = params.privateKey;
            const [key] = pmcw.getKeys(params.privateKey);
            self.fingerprint = pmcw.getFingerprint(key).substring(0, 8);

            setTimeout(() => document.getElementById('password').focus(), 100);

            self.submit = () => {
                pmcw.decryptPrivateKey(privateKey, self.password)
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
