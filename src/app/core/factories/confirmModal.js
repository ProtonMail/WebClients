angular.module('proton.core')
    .factory('confirmModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/confirm.tpl.html',
            /* @ngInject */
            controller: function (params) {

                this.title = params.title;
                this.message = params.message;
                this.confirm = () => params.confirm();
                this.cancel = () => params.cancel();

                // The button is not directly available
                setTimeout(() => angular.element('#confirmModalBtn').focus(), 100);
            }
        });
    });
