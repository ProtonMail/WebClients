angular.module('proton.core')
    .factory('confirmModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/confirm.tpl.html',
            controller(params) {
                const self = this;

                self.title = params.title;
                self.message = params.message;
                self.confirm = () => params.confirm();
                self.cancel = () => params.cancel();

                // The button is not directly available
                setTimeout(() => angular.element('#confirmModalBtn').focus(), 100);
            }
        });
    });
