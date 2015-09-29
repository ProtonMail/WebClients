angular.module("proton.heightOutside", [])

.directive('ngHeightOutside', ['$window', function ($window) {
    return function (scope, element, attrs) {

        function setHeight() {

            var windowHeight = angular.element($window).height();
            var elementOffset = element[0].getBoundingClientRect();
            var height = (windowHeight - elementOffset.top - 200);

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
