import { getEventName } from '../../../blackFriday/helpers/blackFridayHelper';

/* @ngInject */
function navigationBlackFriday($stateParams, blackFridayModalOpener, $cookies, dispatchers, blackFridayModel) {
    const COOKIE_NAME = 'protonmail-BF-autoload-modal';

    /*
         Cookie is not bulletproof
      */
    const isFirstTime = () => {
        try {
            const value = $cookies.get(COOKIE_NAME) || localStorage.getItem(COOKIE_NAME);
            return value && value === 'true';
        } catch (e) {
            // ( ･_･)ﾉ  ⌒●~*
        }
    };

    const setAlreadySeen = () => {
        try {
            $cookies.put(COOKIE_NAME, 'true');
            localStorage.setItem(COOKIE_NAME, 'true');
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

            const id = setInterval(refresh, 60000);
            refresh();

            on('blackFriday', (event, { type = '' }) => {
                if (type === 'run') {
                    // Open only once then you need to click button
                    if (!isFirstTime() && blackFridayModel.isDealPeriod()) {
                        blackFridayModalOpener();
                        setAlreadySeen();
                    }
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
