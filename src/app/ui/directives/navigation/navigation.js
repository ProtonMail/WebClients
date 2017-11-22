angular.module('proton.ui')
    .directive('navigation', ($rootScope, blackFridayModel) => {
        const IS_BLACK_FRIDAY_CLASS = 'navigation-is-black-friday';

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/ui/navigation/navigation.tpl.html',
            link(scope, element) {
                const unsubscribe = [];
                const update = () => element[0].classList[blackFridayModel.isBlackFridayPeriod(true) ? 'add' : 'remove'](IS_BLACK_FRIDAY_CLASS);
                unsubscribe.push($rootScope.$on('subscription', (event, { type = '' }) => {
                    (type === 'update') && update();
                }));

                unsubscribe.push($rootScope.$on('blackFriday', (event, { type = '' }) => {
                    (type === 'tictac') && update();
                }));

                update();

                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
