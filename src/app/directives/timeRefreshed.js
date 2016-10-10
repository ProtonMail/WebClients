angular.module('proton.time', [])
.directive('timeRefreshed', ($filter) => {
    return {
        link(scope, element, attrs) {

            const interval = attrs.timeInterval || 1000;
            const filter = attrs.timeFilter || 'delay';
            const isTime = element[0].nodeName === 'TIME';

            const id = setInterval(updateTime, interval);

            function updateTime() {
                isTime && element[0].setAttribute('datetime', (new Date(+attrs.timeRefreshed || Date.now())).toISOString());
                element.text($filter(filter)(attrs.timeRefreshed));
            }

            updateTime();

            scope
                .$on('$destroy', () => {
                    clearInterval(id);
                });
        }
    };
});
