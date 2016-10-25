angular.module('proton.core')
.factory('bugModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/bug.tpl.html',
        controller(params) {
            // Variables
            this.form = params.form;
            this.form.attachScreenshot = false; // Do not attach screenshot by default
            // Functions
            this.submit = () => {
                if (params.submit) {
                    params.submit(this.form);
                }
            };

            this.cancel = () => {
                if (params.cancel) {
                    params.cancel();
                }
            };
        }
    });
});
