/* @ngInject */
function visionaryColumn() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/dashboard/visionaryColumn.tpl.html')
    };
}
export default visionaryColumn;
