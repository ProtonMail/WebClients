angular.module('proton.dashboard')
    .directive('activePlan', ($rootScope, subscriptionModel) => {
        const PLANS = ['free', 'plus', 'professional', 'visionary'];

        return {
            restrict: 'A',
            link(scope, element) {
                const update = () => element.removeClass(PLANS.join('-active ')).addClass(subscriptionModel.name() + '-active');
                const unsubscribe = $rootScope.$on('subscription', (event, { type }) => {
                    (type === 'update') && update();
                });

                update();

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
