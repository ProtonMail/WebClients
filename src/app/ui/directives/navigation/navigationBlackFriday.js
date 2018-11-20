import { getEventName } from '../../../blackFriday/helpers/blackFridayHelper';

/* @ngInject */
function navigationBlackFriday($stateParams, blackFridayModalOpener) {
    const onClick = () => {
        blackFridayModalOpener();
    };

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

            const id = setInterval(refresh, 60000);
            refresh();

            element.on('click', onClick);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
                clearInterval(id);
            });
        }
    };
}
export default navigationBlackFriday;
