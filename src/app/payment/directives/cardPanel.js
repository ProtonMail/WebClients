/* @ngInject */
function cardPanel() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/payment/cardPanel.tpl.html'),
        scope: { card: '=' }
    };
}
export default cardPanel;
