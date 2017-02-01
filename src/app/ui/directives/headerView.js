angular.module('proton.ui')
.directive('headerView', () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/ui/headerView.tpl.html'
    };
});
