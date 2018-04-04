/* @ngInject */
function exportKeyModal(pmModal, pmcw, authentication) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/exportPrivateKeyModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            self.passwordMode = authentication.user.PasswordMode;
            self.password = '';

            setTimeout(() => document.getElementById('password').focus(), 100);

            self.submit = () => {
                pmcw
                    .decryptPrivateKey(params.privateKey, authentication.getPassword())
                    .then((privateKey) => pmcw.encryptPrivateKey(privateKey, self.password))
                    .then((armor) => params.export(armor));
            };

            self.cancel = () => {
                params.cancel();
            };
        }
    });
}
export default exportKeyModal;
