import { getEventName } from '../../../blackFriday/helpers/blackFridayHelper';

/* @ngInject */
function navigationBlackFriday(blackFridayModalOpener, $cookies, dispatchers, blackFridayModel, authentication) {
    const COOKIE_NAME = 'protonmail-BF-autoload-modal';
    const IS_BLACK_FRIDAY_CLASS = 'navigationBlackFriday-is-black-friday';

    /*
        Cookie is not bulletproof
    */
    const alreadySeen = (name) => {
        try {
            const value = $cookies.get(`${COOKIE_NAME}-${name}`) || localStorage.getItem(`${COOKIE_NAME}-${name}`);
            return value && value === 'true';
        } catch (e) {
            // ( ･_･)ﾉ  ⌒●~*
        }
    };

    const setAlreadySeen = (name) => {
        try {
            $cookies.put(`${COOKIE_NAME}-${name}`, 'true');
            localStorage.setItem(`${COOKIE_NAME}-${name}`, 'true');
        } catch (e) {
            // ( ･_･)ﾉ  ⌒●~*
        }
    };

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

                if (!alreadySeen(authentication.user.ID) && showPromo) {
                    blackFridayModalOpener();
                    setAlreadySeen(authentication.user.ID);
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
