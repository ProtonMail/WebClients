/* @ngInject */
function filterAddressModal(pmModal, spamListModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/filter/filterAddressModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.filter = { Email: '' };
            this.cancel = params.close;
            this.type = params.type;
            this.create = () => {
                spamListModel.list(spamListModel.getType(params.type)).add(this.filter.Email);
                params.close();
            };

            setTimeout(() => {
                angular.element('#emailAddress').focus();
            }, 100);
        }
    });
}
export default filterAddressModal;
