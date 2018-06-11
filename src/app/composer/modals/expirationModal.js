/* @ngInject */
function expirationModal(pmModal) {
    const TOGGLE_LIST_AUTOMATICALLY = 3;

    // Check whether the list should be toggled automatically or not.
    const shouldToggle = (list = []) => list.length <= TOGGLE_LIST_AUTOMATICALLY;

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/expirationModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.recipients = params.recipients;
            this.toggles = {
                pgp: { toggle: shouldToggle(this.recipients.pgp) },
                clear: { toggle: shouldToggle(this.recipients.clear) }
            };
            this.confirm = params.confirm;
            this.cancel = params.cancel;
        }
    });
}

export default expirationModal;
