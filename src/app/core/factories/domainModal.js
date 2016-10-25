angular.module('proton.core')
.factory('domainModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/domain.tpl.html',
        controller(params) {
            // Variables
            this.step = params.step;
            this.domain = params.domain;
            this.name = '';

            // Functions
            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            this.submit = () => {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.name);
                }
            };

            this.next = () => {
                if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                    params.next();
                }
            };

            this.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
});
