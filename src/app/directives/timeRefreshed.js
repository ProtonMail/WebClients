angular.module('proton.time', [])
.directive('timeRefreshed', ($filter) => {

    const getDate = (time = 0) => {
        const value = +time * 1000;
        return (new Date(value || Date.now())).toISOString();
    };

    return {
        link(scope, element, { timeRefreshed, timeInterval = 1000, timeFilter = 'delay' }) {

            const isTime = element[0].nodeName === 'TIME';
            const filter = $filter(timeFilter);
            isTime && element[0].setAttribute('datetime', getDate(timeRefreshed));
            const id = setInterval(updateTime, timeInterval);

            function updateTime() {
                element.text(filter(timeRefreshed));
            }

            updateTime();

            scope
                .$on('$destroy', () => {
                    clearInterval(id);
                });
        }
    };
});
