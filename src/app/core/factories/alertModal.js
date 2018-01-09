/* @ngInject */
function alertModal(pmModal) {
    return pmModal({
        /* @ngInject */
        controller: function(params) {
            this.title = params.title;
            this.message = params.message;
            this.alert = params.alert || 'alert-info';

            this.ok = () => {
                params.ok();
            };
        },
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/alert.tpl.html')
    });
}
export default alertModal;
