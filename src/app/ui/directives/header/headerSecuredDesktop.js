/* @ngInject */
function headerSecuredDesktop() {
    return {
        restrict: 'E',
        replace: true,
        controller: 'HeaderController',
        templateUrl: require('../../../../templates/ui/header/headerSecuredDesktop.tpl.html')
    };
}
export default headerSecuredDesktop;
