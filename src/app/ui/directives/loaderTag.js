angular.module('proton.ui')
.directive('loaderTag', () => ({
    restrict: 'E',
    replace: true,
    templateUrl: 'templates/directives/loader-tag.tpl.html'
}));
