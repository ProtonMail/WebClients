/* @ngInject */
function switchPasswordModeModal(userSettingsModel, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/switchPasswordMode.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            self.currentPasswordMode = userSettingsModel.get('PasswordMode');
            self.save = () => {};
            self.cancel = params.cancel;
        }
    });
}
export default switchPasswordModeModal;
