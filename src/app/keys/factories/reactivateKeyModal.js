/* @ngInject */
function reactivateKeyModal(pmModal, userSettingsModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/reactivateKeyModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.cancel = params.cancel;
            this.submit = () => params.submit(this.password);
            this.import = () => params.import();
            this.passwordMode = userSettingsModel.get('PasswordMode');
            this.password = '';

            setTimeout(() => document.getElementById('password').focus(), 100);
        }
    });
}
export default reactivateKeyModal;
