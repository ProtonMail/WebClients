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
                textEl.textContent = getEventName();
            };

            const update = () => {
                element[0].classList[blackFridayModel.isBlackFridayPeriod() ? 'add' : 'remove'](IS_BLACK_FRIDAY_CLASS);
            };

            const id = setInterval(refresh, 60000);

            refresh();
            update();

            on('subscription', (event, { type = '' }) => {
                type === 'update' && update();
            });

            on('updateUser', update);

            on('blackFriday', (event, { type = '' }) => {
                if (type === 'run') {
                    update();
                    // Open only once then you need to click button
                    if (!alreadySeen(authentication.user.ID) && blackFridayModel.isBlackFridayPeriod()) {
                        blackFridayModalOpener();
                        setAlreadySeen(authentication.user.ID);
                    }
                }
            });

            if (!alreadySeen(authentication.user.ID) && blackFridayModel.isProductPayerPeriod()) {
                blackFridayModalOpener();
                setAlreadySeen(authentication.user.ID);
            }

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
