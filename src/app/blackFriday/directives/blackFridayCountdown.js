import { TIME, BLACK_FRIDAY } from '../../constants';
import { isBlackFriday, isBlackFridayExtension, isCyberMonday } from '../helpers/blackFridayHelper';

/* @ngInject */
function blackFridayCountdown(translator, gettextCatalog) {
    const I18N = translator(() => ({
        days(n) {
            return gettextCatalog.getPlural(
                n,
                '{{$count}} day',
                '{{$count}} days',
                {},
                'blackfriday X days before the end'
            );
        },
        hours(n) {
            return gettextCatalog.getPlural(
                n,
                '{{$count}} hour',
                '{{$count}} hours',
                {},
                'blackfriday X hours before the end'
            );
        },
        minutes(n) {
            return gettextCatalog.getPlural(
                n,
                '{{$count}} minute',
                '{{$count}} minutes',
                {},
                'blackfriday X minutes before the end'
            );
        },
        seconds(n) {
            return gettextCatalog.getPlural(
                n,
                '{{$count}} second',
                '{{$count}} seconds',
                {},
                'blackfriday X seconds before the end'
            );
        },
        expired: gettextCatalog.getString('Expired', null, 'blackfriday Info')
    }));

    const render = (today, ts) => {
        const diff = moment(ts).diff(today);

        if (diff < 0) {
            return I18N.expired;
        }

        const days = Math.floor(diff / TIME.DAY);
        const hours = Math.floor((diff % TIME.DAY) / TIME.HOUR);
        const minutes = Math.floor((diff % TIME.HOUR) / TIME.MINUTE);
        const seconds = Math.floor((diff % TIME.MINUTE) / TIME.SECOND);

        return [I18N.days(days), I18N.hours(hours), I18N.minutes(minutes), I18N.seconds(seconds)].join(' | ');
    };

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/blackFriday/blackFridayCountdown.tpl.html'),
        scope: {},
        link(scope, el) {
            const refresh = () => {
                const today = moment(new Date());
                if (isBlackFriday()) {
                    el[0].textContent = render(today, BLACK_FRIDAY.BETWEEN.CYBER_START);
                    return;
                }
                if (isCyberMonday()) {
                    el[0].textContent = render(today, BLACK_FRIDAY.BETWEEN.CYBER_END);
                    return;
                }
                if (isBlackFridayExtension()) {
                    el[0].textContent = render(today, BLACK_FRIDAY.BETWEEN.END);
                    return;
                }
                el[0].textContent = I18N.expired;
            };

            refresh();

            const id = setInterval(refresh, TIME.SECOND);

            scope.$on('$destroy', () => {
                clearInterval(id);
            });
        }
    };
}

export default blackFridayCountdown;
