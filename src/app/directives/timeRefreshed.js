angular.module("proton.time", [])
.directive("timeRefreshed", function($filter) {
    return {
        link: function(scope, element, attrs) {

            var interval = attrs.timeInterval || 1000;
            var filter = attrs.timeFilter || 'delay';
            var isTime = element[0].nodeName === 'TIME';

            var id = setInterval(updateTime, interval);

            function updateTime() {
                isTime && element[0].setAttribute('datetime', (new Date(+attrs.timeRefreshed || Date.now())).toISOString());
                element.text($filter(filter)(attrs.timeRefreshed));
            }

            updateTime();

            scope
                .$on('$destroy', function () {
                    clearInterval(id);
                });
        }
    };
});
