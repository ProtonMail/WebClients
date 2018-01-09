/* @ngInject */
function contactMergerModal(gettextCatalog, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactMergerModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.title = gettextCatalog.getPlural(Object.keys(params.emails).length, '1 Duplicate found', '{{$count}} Duplicates found', {});
            this.emails = params.emails;
            this.cancel = () => params.close();
            this.merge = () => params.merge(this.emails);
        }
    });
}
export default contactMergerModal;
