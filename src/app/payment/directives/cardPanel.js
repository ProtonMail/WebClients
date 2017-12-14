/* @ngInject */
function cardPanel() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/payment/cardPanel.tpl.html',
        scope: { card: '=' }
    };
}
export default cardPanel;
