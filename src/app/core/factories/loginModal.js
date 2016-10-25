angular.module('proton.core')
.factory('loginModal', (pmModal) => {
    return pmModal({
        controller(params) {
            this.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginHelp.tpl.html'
    });
});
