angular.module('proton.contact')
    .factory('contactMergerModal', (gettextCatalog, pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/contactMergerModal.tpl.html',
            controller(params) {
                this.title = gettextCatalog.getPlural(Object.keys(params.emails).length, '1 Duplicate found', '{{$count}} Duplicates found', {});
                this.emails = params.emails;
                this.cancel = () => params.close();
                this.merge = () => params.merge(this.emails);
            }
        });
    });
