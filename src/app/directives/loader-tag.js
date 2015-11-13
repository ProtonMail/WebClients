angular.module("proton.loaderTag", [])
.directive('loaderTag', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/loader-tag.tpl.html'
    };
});