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
            const promise = $interval(() => displayTime(), minute, false);
            scope.$on('$destroy', () => $interval.cancel(promise));
            displayTime();
            function displayTime() {
                element[0].innerHTML = getTime();
            }
            function getTime() {
                const type = tools.typeList();
                const loc = tools.currentLocation();
                const time = (type === 'conversation') ? cache.getTime(ID, loc) : Time;
                const m = moment.unix(time);
                const format = (m.isSame(moment(), 'day')) ? 'LT' : 'll';
                return m.format(format);
            }
        }
    };
});
