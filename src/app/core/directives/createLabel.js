angular.module('proton.core')
.directive('createLabel', () => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/createLabel.tpl.html',
        scope: {
            name: '=labelName'
        },
        link(scope) {
            scope.create = () => {

            };
        }
    };
});
