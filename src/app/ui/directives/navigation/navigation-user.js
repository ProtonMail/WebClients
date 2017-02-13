angular.module('proton.ui')
.directive('navigationUser', () => {
    return {
        replace: true,
        templateUrl: 'templates/ui/navigation/navigationUser.tpl.html'
    };
});
