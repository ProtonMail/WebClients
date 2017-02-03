angular.module('proton.ui')
.directive('headerMobileView', () => {
    return {
        scope: {},
        replace: true,
        controller: 'HeaderController',
        templateUrl: 'templates/ui/headerMobileView.tpl.html'
    };
});
