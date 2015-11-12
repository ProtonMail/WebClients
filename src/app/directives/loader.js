angular.module("proton.loader", [])

.directive('loader', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/loader.tpl.html',
        replace: true
    };
});
