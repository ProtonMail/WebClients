/* @ngInject */
function headerSecuredDesktop() {
    return {
        restrict: 'E',
        replace: true,
        controller: 'HeaderController',
        templateUrl: 'templates/ui/header/headerSecuredDesktop.tpl.html'
    };
}
export default headerSecuredDesktop;
