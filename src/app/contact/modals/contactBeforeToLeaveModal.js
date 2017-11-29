angular.module('proton.contact')
    .factory('contactBeforeToLeaveModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/contactBeforeToLeaveModal.tpl.html',
            /* @ngInject */
            controller: function (params) {
                this.save = params.save;
                this.discard = params.discard;
                this.cancel = params.cancel;
            }
        });
    });
