angular.module("proton.dropdown", [])

.directive('ngDropdown', ['$timeout', function ($timeout) {
    return function (scope, element, attrs) {

        // lower is faster. 1000 = 1 second.
        var animationDuration = 120;
        var timer;

        element.bind("click", function (event) {
            if (element.hasClass('active')) {
                hideDropdown(element);
            }
            else {
                showDropdown(element);
            }
            return false;
        });

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
}]);
