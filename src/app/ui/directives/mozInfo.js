/* @ngInject */
function mozInfo() {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/mozInfo.tpl.html')
    };
}
export default mozInfo;
