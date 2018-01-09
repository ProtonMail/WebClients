/* @ngInject */
function vpnDiscountPanel() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/dashboard/vpnDiscountPanel.tpl.html')
    };
}
export default vpnDiscountPanel;
