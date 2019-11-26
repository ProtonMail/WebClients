/* @ngInject */
function navigation() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigation.tpl.html')
    };
}
export default navigation;
