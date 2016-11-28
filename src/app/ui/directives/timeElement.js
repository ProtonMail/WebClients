angular.module('proton.ui')
.directive('timeElement', ($rootScope, cache, tools) => {
    /**
    * Get time from element context
    * @return {String}
    */
    function getTime({ ID, Time }) {
        const type = tools.typeList();
        const loc = tools.currentLocation();
        const time = (type === 'conversation') ? cache.getTime(ID, loc) : Time;
        const m = moment.unix(time);
        const format = (m.isSame(moment(), 'day')) ? 'LT' : 'll';
        return m.format(format);
    }
    return {
        restrict: 'E',
        replace: true,
        template: '<time class="time"></time>',
        link(scope, element) {
            const unsubscribe = $rootScope.$on('refreshTimeElement', () => displayTime());
            scope.$on('$destroy', () => unsubscribe());
            displayTime();
            /**
             * Insert new time value inside the element
             */
            function displayTime() {
                element[0].textContent = getTime(scope.conversation);
            }
        }
    };
});
