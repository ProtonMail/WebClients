import { isEdge, isIE11 } from '../../../helpers/browser';

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

            // Both are not able to open the link
            this.punyCodeLinkIE = /:\/\/xn--/.test(params.link) && (isEdge() || isIE11());

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
