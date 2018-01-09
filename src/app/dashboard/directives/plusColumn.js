/* @ngInject */
function plusColumn() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/dashboard/plusColumn.tpl.html')
    };
}
export default plusColumn;
