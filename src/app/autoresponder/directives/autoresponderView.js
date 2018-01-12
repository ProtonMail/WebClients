/* @ngInject */
function autoresponderView(userType) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/autoresponder/autoresponderView.tpl.html'),
        scope: {},
        link(scope) {
            scope.isFree = userType().isFree;
        }
    };
}
export default autoresponderView;
