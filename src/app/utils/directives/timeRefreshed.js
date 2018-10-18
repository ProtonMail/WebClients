/* @ngInject */
function timeRefreshed($filter, dispatchers) {
    const getDate = (time = 0) => {
        const value = +time * 1000;
        return new Date(value || Date.now()).toISOString();
    };

    return {
        restrict: 'A',
        link(scope, element, attrs) {
            const { on, unsubscribe } = dispatchers();
            const isTime = element[0].nodeName === 'TIME';
            const { timeInterval = 1000, timeFilter = 'delay' } = attrs;
            const filter = $filter(timeFilter);

            const updateTime = () => {
                const timeRefreshed = attrs.timeRefreshed;
                element.text(filter(timeRefreshed));
                isTime && element[0].setAttribute('datetime', getDate(timeRefreshed));
            };
            const id = setInterval(updateTime, timeInterval);

            updateTime();

            on('elements', (e, { type }) => {
                type === 'refresh.time' && updateTime();
            });

            scope.$on('$destroy', () => {
                clearInterval(id);
                unsubscribe();
            });
        }
    };
}
export default timeRefreshed;
