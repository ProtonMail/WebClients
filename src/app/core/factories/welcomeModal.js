/* @ngInject */
function welcomeModal(pmModal, authentication, addressesModel, signatureModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/welcome.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { Name = '' } = authentication.user;
            const { DisplayName = '', Signature = '' } = addressesModel.getFirst();

            this.displayName = DisplayName || Name;
            this.cancel = params.cancel;
            this.next = () => {
                this.displayName.length &&
                    signatureModel.save({
                        DisplayName: this.displayName,
                        Signature
                    });
                params.next();
            };
        }
    });
}
export default welcomeModal;
