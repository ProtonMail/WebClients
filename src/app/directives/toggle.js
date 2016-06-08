angular.module("proton.toggle", [])

.directive("toggle", function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/toggle.tpl.html',
        scope: {
            status: '=', // status value
            change: '&change', // method called when status change
            on: '@', // text for on
            off: '@' // text for off
        },
        link: function(scope, element, attrs) {
            // Initialization
            if(angular.isUndefined(scope.status)) {
                scope.check = true;
            } else {
                scope.check = Boolean(scope.status);
            }

            if(angular.isUndefined(scope.on)) {
                scope.on = 'Yes';
            }

            if(angular.isUndefined(scope.off)) {
                scope.off = 'No';
            }

            // Functions
            scope.click = function(event) {
                scope.check = !scope.check;

                if(angular.isNumber(scope.status)) {
                    scope.status = Number(scope.check);
                } else {
                    scope.status = scope.check;
                }

                if(angular.isDefined(scope.change) && angular.isFunction(scope.change)) {
                    // Need to delay the change to be sure, the model is updated
                    setTimeout(function() {
                        scope.change();
                    }, 200);
                }
            };
        }
    };
});
