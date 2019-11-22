import { getEventName } from '../../../blackFriday/helpers/blackFridayHelper';

/* @ngInject */
function navigationBlackFriday() {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigationBlackFriday.tpl.html'),
        link(scope, element) {
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

            on('updateUser', update);

            scope.$on('$destroy', () => {
                clearInterval(id);
            });
        }
    };
}
export default navigationBlackFriday;
