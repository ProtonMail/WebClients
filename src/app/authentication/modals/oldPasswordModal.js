/* @ngInject */
function oldPasswordModal(pmModal, userSettingsModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/authentication/modals/oldPasswordModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.cancel = params.cancel;
            this.submit = () => params.submit(this.password);
            this.passwordMode = userSettingsModel.get('PasswordMode');
            this.password = '';

            setTimeout(() => document.getElementById('password').focus(), 100);
        }
    });
}
export default oldPasswordModal;
