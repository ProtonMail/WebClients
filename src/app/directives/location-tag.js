angular.module("proton.locationTag", [])
.directive("locationTag", function(tools) {
    return {
        restrict: 'E',
        templateUrl: "templates/directives/location-tag.tpl.html",
        link: function(scope, element, attrs) {
            scope.in = function(location) {
                return scope.conversation.LabelIDs.indexOf(location.toString()) !== -1;
            };
        }
    };
});
