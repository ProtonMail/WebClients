/* @ngInject */
function bridgeView(userType) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/bridge/bridgeView.tpl.html'),
        link(scope) {
            scope.isFree = userType().isFree;
        }
    };
}
export default bridgeView;
