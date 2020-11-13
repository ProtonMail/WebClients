import { getEventName } from '../../../blackFriday/helpers/blackFridayHelper';

/* @ngInject */
function navigationBlackFriday(blackFridayModalOpener, dispatchers, blackFridayModel) {
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
                const showPromo = blackFridayModel.isProductPayerPeriod() || blackFridayModel.isBlackFridayPeriod();
                textEl.textContent = getEventName(blackFridayModel.isProductPayerPeriod());
                element[0].classList[showPromo ? 'add' : 'remove'](IS_BLACK_FRIDAY_CLASS);

                if (showPromo) {
                    blackFridayModel.getCloseState().then((showModal) => {
                        if (showModal) {
                            blackFridayModalOpener();
                        }
                    });
                }
            };

            const id = setInterval(refresh, 60000);

            refresh();

            on('subscription', (event, { type = '' }) => {
                type === 'update' && refresh();
            });

            on('updateUser', refresh);

            on('blackFriday', (event, { type = '' }) => {
                // Event received after checking status of the latest subscription
                if (type === 'run') {
                    refresh();
                }
            });

            element.on('click', blackFridayModalOpener);

            scope.$on('$destroy', () => {
                element.off('click', blackFridayModalOpener);
                clearInterval(id);
                unsubscribe();
            });
        }
    };
}
export default navigationBlackFriday;
