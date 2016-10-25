angular.module('proton.core')
.factory('verificationModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/verification.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function (name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.next = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                    params.next();
                }
            };
            this.close = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
});
