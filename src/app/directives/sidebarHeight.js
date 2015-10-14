angular.module("proton.sidebarHeight", [])

.directive('ngSidebarHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {

        function setHeight() {

            var windowHeight = angular.element($window).height();
            var headerHeight = $('#pm_header').outerHeight();
            var height = (windowHeight - headerHeight);

            element.css({
                height: height
            });

        }

        scope.$on('resized', function() {
            setHeight();
        });

        var init = setInterval( setHeight, 120);
        setTimeout( function() {
            clearInterval(init);
        }, 2400);

    };
}]);
