angular.module('proton.core')
.factory('domainModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/domain.tpl.html',
        controller(params) {
            const self = this;

            self.step = params.step;
            self.domain = params.domain;
            self.name = '';

            // Functions
            self.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            self.submit = () => {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(self.name);
                }
            };

            self.next = () => {
                if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                    params.next();
                }
            };

            self.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            self.beginsWith = (value = '') => {
                const { name = '' } = self;
                return name.substring(0, value.length) === value;
            };
        }
    });
});
