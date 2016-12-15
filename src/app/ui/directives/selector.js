angular.module('proton.ui')
    .directive('selector', () => {
        return {
            restrict: 'E',
            templateUrl: 'templates/directives/selector.tpl.html',
            scope: {
                ngModel: '=', // String or Object
                options: '=', // Array of String or Object
                onSelect: '@' // Method called when a change appear
            },
            link(scope) {

                scope.labelized = function () {
                    if (angular.isString(scope.ngModel)) {
                        scope.label = scope.ngModel;
                    } else if (angular.isObject(scope.ngModel) && angular.isDefined(scope.ngModel.label)) {
                        scope.label = scope.ngModel.label;
                    }
                };

                scope.select = function (option) {
                    scope.ngModel = angular.copy(option);
                    scope.labelized();

                    if (angular.isFunction(scope.onSelect)) {
                        scope.onSelect(option);
                    }
                };

                scope.labelized();
            }
        };
    });
