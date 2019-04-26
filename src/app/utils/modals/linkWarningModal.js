import { getItem, setItem, removeItem } from '../../../helpers/storageHelper';
import { LINK_WARNING } from '../../constants';

const { KEY, VALUE } = LINK_WARNING;

/* @ngInject */
function linkWarningModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/utils/linkWarningModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.preference = !!getItem(KEY);
            this.link = params.link;
            this.cancel = params.close;

            this.continue = () => {
                if (this.preference) {
                    setItem(KEY, VALUE);
                } else {
                    removeItem(KEY);
                }

                params.close();
                window.open(this.link, '_blank', 'noopener');
            };
        }
    });
}
export default linkWarningModal;
