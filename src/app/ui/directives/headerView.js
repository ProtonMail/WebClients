angular.module('proton.ui')
.directive('headerView', (organizationModel) => {
    return {
        restrict: 'E',
        templateUrl: 'templates/ui/headerView.tpl.html'
    };
});
