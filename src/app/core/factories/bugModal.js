/* @ngInject */
function bugModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/bug.tpl.html'),
        /* @ngInject */
        controller: function(params) {
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
}
export default bugModal;
