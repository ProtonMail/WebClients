angular.module('proton.core')
.factory('dmarcModal', (pmModal, $rootScope) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dmarc.tpl.html',
        controller(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };
            this.verify = () => {
                params.verify();
            };
            this.close = () => {
                params.close();
            };
        }
    });
});
