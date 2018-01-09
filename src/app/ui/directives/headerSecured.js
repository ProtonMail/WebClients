/* @ngInject */
function headerSecured() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/ui/header/headerSecured.tpl.html')
    };
}
export default headerSecured;
