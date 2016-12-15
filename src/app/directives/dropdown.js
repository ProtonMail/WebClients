angular.module('proton.dropdown', [])

.directive('dropdown', ($timeout, $document, $rootScope) => {
    return function (scope, element) {
        const parent = element.parent();
        const dropdown = parent.find('.pm_dropdown');

        // Functions
        function showDropdown() {
            element.addClass('active');
            dropdown.show();
            $document.on('click', outside);
        }

        function hideDropdown() {
            element.removeClass('active');
            dropdown.hide();
            $document.off('click', outside);
        }

        function outside(event) {
            if (!dropdown[0].contains(event.target)) {
                hideDropdown();
            }
        }

        function click() {
            if (element.hasClass('active')) {
                hideDropdown();
            } else {
                // Close all dropdowns
                $rootScope.$emit('closeDropdown');
                // Open only this one
                showDropdown();
            }

            return false;
        }

        // Listeners
        element.on('click', click);

        const unsubscribe = $rootScope.$on('closeDropdown', () => {
            hideDropdown();
        });

        scope.$on('$destroy', () => {
            element.off('click', click);
            hideDropdown();
            unsubscribe();
        });
    };
})

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
