angular.module('proton.core')
    .factory('helpLoginModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/authentication/modals/helpLoginModal.tpl.html',
            /* @ngInject */
            controller: function (params) {
                const self = this;
                self.cancel = () => {
                    params.close();
                };
            }
        });
    });
