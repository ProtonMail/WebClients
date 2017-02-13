angular.module('proton.ui')
.directive('navigation', () => {
    return {
        replace: true,
        templateUrl: 'templates/ui/navigation/navigation.tpl.html'
    };
});
