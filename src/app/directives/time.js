angular.module("proton.time", [])
.directive("time", function($interval, $filter) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var interval = $attrs.interval || 1000;
            var filter = $attrs.filter || 'delay';
            var intervalCountdown = $interval(function() {
                updateTime();
            }, interval, false); // don't invoke apply

            function updateTime() {
                var newTitle = $filter(filter)($attrs.time);

                angular.element($element).text(newTitle);
            }

            updateTime();

            $element.bind('$destroy', function() {
                $interval.cancel(intervalCountdown);
            });
        }
    };
});
