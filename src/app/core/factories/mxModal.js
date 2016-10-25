angular.module('proton.core')
.factory('mxModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/mx.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };
            this.next = () => {
                params.next();
            };
            this.close = () => {
                params.close();
            };
        }
    });
});
