/* @ngInject */
function importContactModal(pmModal, dispatchers) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/importContactModal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const { on, unsubscribe } = dispatchers();
            let files = [];

            this.import = () => params.import(files);
            this.cancel = params.cancel;
            this.$onDestroy = unsubscribe;

            on('importCardDropzone', (e, { data }) => {
                files = data;
                $scope.$applyAsync(() => (this.fileDropped = true));
            });
        }
    });
}
export default importContactModal;
