angular.module('proton.core')
.factory('supportModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/support.tpl.html',
        controller(params) {
            this.cancel = () => {
                if (params.cancel) {
                    params.cancel();
                }
            };
        }
    });
});
