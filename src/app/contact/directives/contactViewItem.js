/* @ngInject */
function contactViewItem() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactViewItem.tpl.html'),
        link(scope) {
            scope.formatAddress = (list = []) => list.filter(Boolean);
        }
    };
}
export default contactViewItem;
