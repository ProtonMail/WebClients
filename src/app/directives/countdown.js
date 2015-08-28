angular.module("proton.countdown", [])
.directive("countdown", function($interval) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var interval = 1000; // 1 second
            var intervalCountdown = $interval(function() {
                updateTime();
            }, interval, false); // don't invoke apply

            function updateTime() {
                // get the current moment
                var now = moment(),
                countdown = $attrs.countdown,
                then = moment(countdown * 1000),
        	    // get the difference from now to then in ms
        	    ms = then.diff(now, 'milliseconds', true);

        	    // update the duration in ms
        	    ms = then.diff(now, 'milliseconds', true);
        	    days = Math.floor(moment.duration(ms).asDays());

        	    then = then.subtract(days,'days');
        	    // update the duration in ms
        	    ms = then.diff(now, 'milliseconds', true);
        	    hours = Math.floor(moment.duration(ms).asHours());

        	    then = then.subtract(hours,'hours');
        	    // update the duration in ms
        	    ms = then.diff(now, 'milliseconds', true);
        	    minutes = Math.floor(moment.duration(ms).asMinutes());

        	    then = then.subtract(minutes, 'minutes');
        	    // update the duration in ms
        	    ms = then.diff(now, 'milliseconds', true);
        	    seconds = Math.floor(moment.duration(ms).asSeconds());

        	    // concatonate the variables
        	    var newTitle = days + ' days ' + hours + ' hours ' + minutes + ' minutes ' + seconds + ' seconds';

                // Show how many days, hours, minutes and seconds are left
                if($attrs.outside) {
                    $($element).text(newTitle);
                } else {
                    $($element).attr('data-original-title', newTitle);

                    if(angular.isDefined($($element).data('bs.tooltip').$tip)) {
                        $($element).data('bs.tooltip').$tip.find('.tooltip-inner').text(newTitle);
                    }
                }
            }

            $($element[0]).tooltip({
                container: 'body',
                placement: 'top'
            });

            $element.bind('$destroy', function() {
                $interval.cancel(intervalCountdown);
            });
        }
    };
});
