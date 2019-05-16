/* @ngInject */
function linkWarningModal(pmModal, eventManager, mailSettingsModel, settingsMailApi, networkActivityTracker) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/utils/linkWarningModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            // Do not ask again
            this.preference = !mailSettingsModel.get('ConfirmLink');
            this.link = params.link;
            this.cancel = params.close;

            this.continue = () => {
                params.close();
                const promise = settingsMailApi
                    .updateConfirmLink({ ConfirmLink: +!this.preference })
                    .then(eventManager.call);
                networkActivityTracker.track(promise);
            };
        }
    });
}
export default linkWarningModal;
