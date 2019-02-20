import { formatImage } from '../../../helpers/imageHelper';

/* @ngInject */
function contactViewItem() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactViewItem.tpl.html'),
        link(scope) {
            scope.formatAddress = (list = []) => list.filter(Boolean);
            scope.formatImage = formatImage;
        }
    };
}
export default contactViewItem;
