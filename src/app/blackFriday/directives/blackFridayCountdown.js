import { TIME } from '../../constants';

/* @ngInject */
function blackFridayCountdown() {
    const render = (today, ts) => {
        const diff = moment(ts).diff(today);

        if (diff < 0) {
            return 'Expired';
        }

        const days = Math.floor(diff / TIME.DAY);
        const hours = Math.floor((diff % TIME.DAY) / TIME.HOUR);
        const minutes = Math.floor((diff % TIME.HOUR) / TIME.MINUTE);
        const seconds = Math.floor((diff % TIME.MINUTE) / TIME.SECOND);

        return [`${days} d`, `${hours} h`, `${minutes} m`, `${seconds} s`].join(' : ');
    };

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/blackFriday/blackFridayCountdown.tpl.html'),
        scope: {},
        link(scope, el, { end = '' }) {
            let timestamp = moment(end, 'YYYY-MM-DD').valueOf();
            const today = moment(new Date());

            el[0].textContent = render(today, timestamp);

            const id = setInterval(() => {
                timestamp -= TIME.SECOND;
                el[0].textContent = render(today, timestamp);
            }, TIME.SECOND);

            scope.$on('$destroy', () => {
                clearInterval(id);
            });
        }
    };
}

export default blackFridayCountdown;
