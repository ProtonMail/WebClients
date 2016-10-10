angular.module('proton.loaderTag', [])
.directive('loaderTag', () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/loader-tag.tpl.html'
    };
});
