angular.module("proton.labelHeight", [])

.directive('ngLabelHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {

        function setHeight() {

            var sidebarHeight = $('#pm_sidebar').outerHeight();
            var height = (sidebarHeight - 530);

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
