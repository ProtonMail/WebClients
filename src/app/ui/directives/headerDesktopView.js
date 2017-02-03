angular.module('proton.ui')
.directive('headerDesktopView', () => {
    return {
        scope: {},
        replace: true,
        controller: 'HeaderController',
        templateUrl: 'templates/ui/headerDesktopView.tpl.html'
    };
});
