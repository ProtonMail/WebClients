angular.module("proton.toggle", [])

.directive("toggle", function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/toggle.tpl.html',
        scope: {
            status: '=', // status value
            change: '@change', // method called when status change
            on: '=', // text for on
            off: '=' // text for off
        },
        link: function(scope, element, attrs) {
            // Initialization
            if(angular.isUndefined(scope.status)) {
                scope.status = true;
            }

            if(angular.isUndefined(scope.on)) {
                scope.on = 'Yes';
            }

            if(angular.isUndefined(scope.off)) {
                scope.off = 'No';
            }

            // Functions
            scope.click = function() {
                scope.status = !scope.status;

                if(angular.isDefined(scope.change) && angular.isFunction(scope.change)) {
                    scope.change(scope.status);
                }
            };
        }
    };
});
