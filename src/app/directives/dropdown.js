angular.module('proton.dropdown', [])

.directive('dropdown', function ($timeout) {
    return function (scope, element, attrs) {
        var animationDuration = 50;
        var timer;
        var click = function(event) {
            if (element.hasClass('active')) {
                hideDropdown(element);
            } else {
                showDropdown(element);
            }

            return false;
        };
        var mouseenter = function() {
            $timeout.cancel(timer);
        };
        var mouseleave = function() {
            timer = $timeout(function () {
                hideDropdown(element);
            }, 1000);
        };

        element.bind('click', click);

        scope.$on('$destroy', function() {
            element.unbind('click', click);
            $timeout.cancel(timer);
            element.parent().find('.pm_dropdown').unbind('mouseleave', mouseleave).unbind('mouseenter', mouseenter);
            element.unbind('mouseleave', mouseleave).unbind('mouseenter', mouseenter);
        });

        // If there are no touch events, we can make use of mouse events
        if (!Modernizr.touchevents) {
            element.parent().find('.pm_dropdown').bind('mouseleave', mouseleave).bind('mouseenter', mouseenter);
            element.bind('mouseleave', mouseleave).bind('mouseenter', mouseenter);
        }

        function showDropdown(element) {
            var parent = element.parent();
            var dropdown = parent.find('.pm_dropdown');
            var next = element.next();

            element.addClass('active');
            dropdown.show();
        }

        function hideDropdown(element) {
            var parent = element.parent();
            var dropdown = parent.find('.pm_dropdown');
            var next = element.next();

            element.removeClass('active');
            dropdown.hide();
        }
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
