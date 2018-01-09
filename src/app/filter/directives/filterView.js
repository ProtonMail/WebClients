/* @ngInject */
function filterView() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/filterView.tpl.html'),
        scope: {}
    };
}
export default filterView;
