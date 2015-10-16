angular.module("proton.dropdown", [])

.directive('ngDropdown', function ($timeout) {
    return function (scope, element, attrs) {

        // lower is faster. 1000 = 1 second.
        var animationDuration = 120;
        var timer;

        element.bind("click", function (event) {
            if (element.hasClass('active')) {
                hideDropdown(element);
            } else {
                showDropdown(element);
            }

            return false;
        });

        // If there are no touch events, we can make use of mouse events
        if (!Modernizr.touchevents) {
            element.parent().find('.pm_dropdown')
            .bind('mouseleave', function() {
                timer = $timeout(function () {
                    hideDropdown(element);
                }, 400);
            })
            .bind('mouseenter', function() {
                $timeout.cancel(timer);
            });

            element
            .bind('mouseleave', function() {
                timer = $timeout(function () {
                    hideDropdown(element);
                }, 400);
            })
            .bind('mouseenter', function() {
                $timeout.cancel(timer);
            });
        }

        function showDropdown(element) {
            var parent = element.parent();
            var dropdown = parent.find('.pm_dropdown');

            element.addClass('active');
            dropdown
            .stop(1,1)
            .css('opacity', 0)
            .slideDown(animationDuration)
            .animate(
                { opacity: 1 },
                { queue: false, duration: animationDuration }
            );
        }

        function hideDropdown(element) {
            var parent = element.parent();
            var dropdown = parent.find('.pm_dropdown');

            element.removeClass('active');
            dropdown
            .stop(1,1)
            .css('opacity', 1)
            .slideUp( (animationDuration*2) )
            .animate(
                { opacity: 0 },
                { queue: false, duration: (animationDuration*2) }
            );
        }

    };
})

.directive('actionsButton', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            disable: '=',
            actions: '=' // List of actions available
        },
        templateUrl: 'templates/directives/actions-button.tpl.html',
        link: function(scope, element, attrs) {
            // Initialization of the primary action with the first action
            scope.primary = scope.actions[0];

            scope.select = function(action) {
                scope.primary = action;
                action.action();
            };
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
                scope.disableMain = scope.totalItems === 0; // Main
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
