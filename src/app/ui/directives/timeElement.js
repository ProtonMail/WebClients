angular.module('proton.ui')
.directive('timeElement', ($interval, cache, tools) => {
    return {
        restrict: 'E',
        replace: true,
        scope: { model: '=' },
        template: '<em class="time"></em>',
        link(scope, element) {
            const { ID, Time } = scope.model;
            const minute = 60 * 1000;
            const promise = $interval(() => setTime(), minute);
            scope.$on('$destroy', () => $interval.cancel(promise));
            setTime();
            function setTime() {
                element[0].innerHTML = getTime();
            }
            function getTime() {
                const type = tools.typeList();
                const loc = tools.currentLocation();
                const time = (type === 'conversation') ? cache.getTime(ID, loc) : Time;
                const m = moment.unix(time);
                if (m.isSame(moment(), 'day')) {
                    return m.format('LT');
                }
                return m.format('ll');
            }
        }
    };
});
