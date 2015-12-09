angular.module("proton.countdown", [])
.directive("countdown", function($interval, $filter) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var interval = 1000; // 1 second
            var intervalCountdown = $interval(function() {
                updateTime();
            }, interval, false); // don't invoke apply

            function updateTime() {
                var newTitle = $filter('delay')($attrs.countdown * 1000);

                // Show how many days, hours, minutes and seconds are left
                // if($attrs.outside) {
                    $($element).text(newTitle);
                // } else {
                //     $($element).attr('data-original-title', newTitle);
                //
                //     if(angular.isDefined($($element).data('bs.tooltip').$tip)) {
                //         $($element).data('bs.tooltip').$tip.find('.tooltip-inner').text(newTitle);
                //     }
                // }
            }

            // $($element[0]).tooltip({
            //     container: 'body',
            //     placement: 'top'
            // });

            $element.bind('$destroy', function() {
                $interval.cancel(intervalCountdown);
            });
        }
    };
});
