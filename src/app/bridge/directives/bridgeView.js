/* @ngInject */
function bridgeView(authentication) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: 'templates/bridge/bridgeView.tpl.html',
        link(scope) {
            scope.isFree = !(authentication.user.Subscribed & 1);
        }
    };
}
export default bridgeView;
