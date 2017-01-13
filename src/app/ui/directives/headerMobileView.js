angular.module('proton.ui')
.directive('headerMobileView', () => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/ui/headerMobileView.tpl.html'
    };
});
