/* @ngInject */
function welcomeModal(pmModal, settingsMailApi, mailSettingsModel, authentication, networkActivityTracker) {
    function saveDisplayName(DisplayName) {
        const promise = settingsMailApi.updateDisplayName({ DisplayName });
        networkActivityTracker.track(promise);
    }
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/welcome.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { DisplayName } = mailSettingsModel.get();

            this.displayName = DisplayName;
            this.cancel = params.cancel;
            this.next = () => {
                this.displayName.length && saveDisplayName(this.displayName);
                params.next();
            };
        }
    });
}
export default welcomeModal;
