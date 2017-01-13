angular.module('proton.ui')
.directive('headerDesktopView', () => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/ui/headerDesktopView.tpl.html'
    };
});
