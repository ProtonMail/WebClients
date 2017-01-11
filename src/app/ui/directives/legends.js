angular.module('proton.ui')
.directive('legends', () => {
    return {
        replace: true,
        restrict: 'E',
        scope: { list: '=' },
        templateUrl: 'templates/ui/legends.tpl.html'
    };
});
