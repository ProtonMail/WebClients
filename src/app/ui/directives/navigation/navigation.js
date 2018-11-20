/* @ngInject */
function navigation(dispatchers, blackFridayModel) {
    const IS_BLACK_FRIDAY_CLASS = 'navigation-is-black-friday';

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigation.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const update = () =>
                element[0].classList[blackFridayModel.isDealPeriod(true) ? 'add' : 'remove'](IS_BLACK_FRIDAY_CLASS);

            on('subscription', (event, { type = '' }) => {
                type === 'update' && update();
            });

            on('blackFriday', (event, { type = '' }) => {
                type === 'tictac' && update();
            });

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default navigation;
