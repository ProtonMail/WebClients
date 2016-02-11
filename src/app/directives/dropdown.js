angular.module('proton.dropdown', [])

.directive('dropdown', function ($timeout, $document) {
    return function (scope, element, attrs) {
        // Functions
        var click = function(event) {
            if (element.hasClass('active')) {
                hideDropdown();
            } else {
                showDropdown();
            }

            return false;
        };

        var outside = function(event) {
            if (element !== event.target && !element[0].contains(event.target)) {
                hideDropdown();
            }
        };

        var showDropdown = function() {
            var parent = element.parent();
            var dropdown = parent.find('.pm_dropdown');
            var next = element.next();

            element.addClass('active');
            dropdown.show();
            $document.on('click', outside);
        };

        var hideDropdown = function() {
            var parent = element.parent();
            var dropdown = parent.find('.pm_dropdown');
            var next = element.next();

            element.removeClass('active');
            dropdown.hide();
            $document.off('click', outside);
        };

        // Listeners
        element.on('click', click);

        scope.$on('closeDropdown', function(event) {
            hideDropdown();
        });

        scope.$on('$destroy', function() {
            element.off('click', click);
            hideDropdown();
        });
    };
})

.directive('selector', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/selector.tpl.html',
        scope: {
            ngModel: '=', // String or Object
            options: '=', // Array of String or Object
            onSelect: '@' // Method called when a change appear
        },
        link: function(scope, element, attrs) {

            scope.labelized = function() {
                if(angular.isString(scope.ngModel)) {
                    scope.label = scope.ngModel;
                } else if(angular.isObject(scope.ngModel) && angular.isDefined(scope.ngModel.label)) {
                    scope.label = scope.ngModel.label;
                }
            };

            scope.select = function(option) {
                scope.ngModel = angular.copy(option);
                scope.labelized();

                if(angular.isFunction(scope.onSelect)) {
                    scope.onSelect(option);
                }
            };

            scope.labelized();
        }
    };
})

.directive('paginator', function ($timeout) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/paginator.tpl.html',
        scope: {
            page: '=',
            totalItems: '=',
            itemsPerPage: '=',
            change: '='
        },
        link: function(scope, element, attrs) {
            scope.pages = [];

            var disable = function() {
                scope.disableMain = Math.ceil(scope.totalItems / scope.itemsPerPage) === 1 || scope.totalItems === 0; // Main
                scope.disableP = scope.page === 1 || scope.totalItems === 0; // Previous
                scope.disableN = Math.ceil(scope.totalItems / scope.itemsPerPage) === scope.page || scope.totalItems === 0; // Next
            };

            var buildPages = function() {
                var pages;
                var temp = [];

                if((scope.totalItems % scope.itemsPerPage) === 0) {
                    pages = scope.totalItems / scope.itemsPerPage;
                } else {
                    pages = Math.floor(scope.totalItems / scope.itemsPerPage) + 1;
                }

                for (var i = 1; i <= pages; ++i) {
                    temp.push(i);
                }

                scope.pages = temp;
            };

            scope.$watch('totalItems', function(newValue, oldValue) {
                disable();
                buildPages();
            });

            scope.select = function(p) {
                scope.change(p);
                $timeout(function() {
                    disable();
                }, 0 , true);
            };

            scope.next = function() {
                scope.select(scope.page + 1);
            };

            scope.previous = function() {
                scope.select(scope.page - 1);
            };
        }
    };
});
