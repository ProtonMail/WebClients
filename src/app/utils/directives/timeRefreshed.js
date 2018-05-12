/* @ngInject */
function timeRefreshed($filter, dispatchers) {
    const getDate = (time = 0) => {
        const value = +time * 1000;
        return new Date(value || Date.now()).toISOString();
    };

    return {
        restrict: 'A',
        link(scope, element, { timeRefreshed, timeInterval = 1000, timeFilter = 'delay' }) {
            const { on, unsubscribe } = dispatchers();
            const isTime = element[0].nodeName === 'TIME';
            const filter = $filter(timeFilter);
            isTime && element[0].setAttribute('datetime', getDate(timeRefreshed));
            const updateTime = () => element.text(filter(timeRefreshed));
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
