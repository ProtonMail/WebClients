angular.module('proton.core')
.factory('activateOrganizationModal', ($timeout, pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/activateOrganization.tpl.html',
        controller(params) {

            this.inputCode = '';
            this.alertClass = params.alertClass || 'alert alert-danger';
            this.messageClass = 'alert alert-info';
            this.title = params.title || 'Administrator Key Activation';
            this.prompt = params.prompt || 'Enter activation passcode:';
            this.message = params.message || '';
            this.alert = params.alert || '';
            this.showReset = angular.isDefined(params.reset);

            $timeout(() => {
                $('#inputCode').focus();
            });

            this.submit = () => {
                params.submit(this.inputCode);
            };

            this.cancel = () => {
                params.cancel();
            };

            this.reset = () => {
                params.reset();
            };
        }
    });
});
