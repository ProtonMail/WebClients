angular.module('proton.contact')
    .factory('contactBeforeToLeaveModal', ($rootScope, $state, gettextCatalog, notification, pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/contactBeforeToLeaveModal.tpl.html',
            controller(params) {
                this.save = params.save;
                this.dontSave = params.dontSave;
                this.cancel = params.cancel;
            }
        });
    });
