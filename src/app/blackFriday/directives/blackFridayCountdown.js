import { TIME, BLACK_FRIDAY } from '../../constants';

/* @ngInject */
function blackFridayCountdown(translator, gettextCatalog) {
    const I18N = translator(() => ({
        days(n) {
            return gettextCatalog.getPlural(n, '{{$count}} day', '{{$count}} days', {}, 'X days before the end');
        },
        hours(n) {
            return gettextCatalog.getPlural(n, '{{$count}} hour', '{{$count}} hours', {}, 'X hours before the end');
        },
        minutes(n) {
            return gettextCatalog.getPlural(
                n,
                '{{$count}} minute',
                '{{$count}} minutes',
                {},
                'X minutes before the end'
            );
        },
        seconds(n) {
            return gettextCatalog.getPlural(
                n,
                '{{$count}} second',
                '{{$count}} seconds',
                {},
                'X seconds before the end'
            );
        },
        expired: gettextCatalog.getString('Expired', null, 'Info')
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
            const today = moment(new Date());
            const config = {
                halfDone: false,
                timestamp: +BLACK_FRIDAY.BETWEEN.END_HALF,
                timestampEnd: +BLACK_FRIDAY.BETWEEN.END
            };
            const refresh = () => {
                if (!config.halfDone) {
                    config.timestamp -= TIME.SECOND;
                    const output = render(today, config.timestamp);
                    config.halfDone = output === I18N.expired;
                    !config.halfDone && (el[0].textContent = output);
                }

                if (config.halfDone) {
                    config.timestampEnd -= TIME.SECOND;
                    el[0].textContent = render(today, config.timestampEnd);
                }
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
