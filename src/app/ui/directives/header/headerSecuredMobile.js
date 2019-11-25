/* @ngInject */
function headerSecuredMobile(dispatchers, blackFridayModel) {
    const IS_BLACK_FRIDAY_CLASS = 'navigation-is-black-friday';

    return {
        restrict: 'E',
        replace: true,
        controller: 'HeaderController',
        templateUrl: require('../../../../templates/ui/header/headerSecuredMobile.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const update = () =>
                element[0].classList[blackFridayModel.isDealPeriod(true) ? 'add' : 'remove'](IS_BLACK_FRIDAY_CLASS);

            on('subscription', (event, { type = '' }) => {
                type === 'update' && update();
            });

            on('updateUser', update);

            on('blackFriday', (event, { type = '' }) => {
                type === 'run' && update();
            });

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default headerSecuredMobile;
