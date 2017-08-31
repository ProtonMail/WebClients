angular.module('proton.core')
    .factory('spfModal', (pmModal, $rootScope) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/domain/spf.tpl.html',
            /* @ngInject */
            controller: function (params) {
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
