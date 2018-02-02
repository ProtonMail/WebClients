/* @ngInject */
function welcomeModal(pmModal, authentication, signatureModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/welcome.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { Name = '' } = authentication.user;

            this.displayName = Name;
            this.cancel = params.cancel;
            this.next = () => {
                this.displayName.length && signatureModel.save({ DisplayName: this.displayName });
                params.next();
            };
        }
    });
}
export default welcomeModal;
