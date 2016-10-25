angular.module('proton.core')
.factory('dkimModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dkim.tpl.html',
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
