angular.module('proton.locationTag', [])
.directive('locationTag', () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/location-tag.tpl.html',
        link(scope) {
            scope.in = function (location) {
                return scope.conversation.LabelIDs.indexOf(location.toString()) !== -1;
            };
        }
    };
});
