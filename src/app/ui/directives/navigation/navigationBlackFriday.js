import { getEventName } from '../../../blackFriday/helpers/blackFridayHelper';

/* @ngInject */
function navigationBlackFriday(blackFridayModel, dispatchers) {
    const IS_BLACK_FRIDAY_CLASS = 'navigationBlackFriday-is-black-friday';

    return {
        restrict: 'E',
        scope: {},
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigationBlackFriday.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();

            const textEl = element[0].querySelector('.navigation-title');

            const refresh = () => {
                textEl.textContent = getEventName();
            };

            const update = () => {
                element[0].classList[blackFridayModel.isDealPeriod(true) ? 'add' : 'remove'](IS_BLACK_FRIDAY_CLASS);
            };

            const id = setInterval(refresh, 60000);

            refresh();
            update();

            on('subscription', (event, { type = '' }) => {
                type === 'update' && update();
            });

            on('blackFriday', (event, { type = '' }) => {
                type === 'run' && update();
            });

            on('updateUser', update);

            scope.$on('$destroy', () => {
                clearInterval(id);
                unsubscribe();
            });
        }
    };
}
export default navigationBlackFriday;
