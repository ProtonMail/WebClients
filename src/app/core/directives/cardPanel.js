/* @ngInject */
function cardPanel() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/cardPanel.tpl.html',
        scope: { card: '=' }
    };
}
export default cardPanel;
