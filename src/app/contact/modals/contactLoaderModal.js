angular.module('proton.contact')
    .factory('contactLoaderModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/contactLoaderModal.tpl.html',
            controller(params) {
                this.mode = params.mode;
            }
        });
    });
