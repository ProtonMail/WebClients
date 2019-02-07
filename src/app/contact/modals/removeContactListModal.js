/* @ngInject */
function removeContactListModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/removeContactListModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.list = params.list;

            this.checkAll = false;
            this.onSelectAll = () => {
                this.list.forEach((contact) => {
                    contact.selected = this.checkAll;
                });
            };

            this.submit = () => {
                params.submit(this.list.filter(({ selected }) => selected));
            };
        }
    });
}
export default removeContactListModal;
