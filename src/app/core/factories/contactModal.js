angular.module('proton.core')
.factory('contactModal', (pmModal) => {
    return pmModal({
        controller(params, $timeout) {
            this.name = params.name;
            this.email = params.email;
            this.title = params.title;

            this.save = () => {
                if (angular.isDefined(params.save) && angular.isFunction(params.save)) {
                    params.save(this.name, this.email);
                }
            };

            this.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(() => {
                $('#contactName').focus();
            }, 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/contact.tpl.html'
    });
});
