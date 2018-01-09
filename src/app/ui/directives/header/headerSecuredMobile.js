/* @ngInject */
function headerSecuredMobile() {
    return {
        restrict: 'E',
        replace: true,
        controller: 'HeaderController',
        templateUrl: require('../../../../templates/ui/header/headerSecuredMobile.tpl.html')
    };
}
export default headerSecuredMobile;
