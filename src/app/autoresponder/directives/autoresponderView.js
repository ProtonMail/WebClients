/* @ngInject */
function autoresponderView(authentication) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/autoresponder/autoresponderView.tpl.html'),
        scope: {},
        link(scope) {
            scope.isFree = !(authentication.user.Subscribed & 1);
        }
    };
}
export default autoresponderView;
