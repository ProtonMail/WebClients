import _ from 'lodash';

/* @ngInject */
function contactSelectorModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactSelectorModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            _.extend(this, params);
        }
    });
}
export default contactSelectorModal;
