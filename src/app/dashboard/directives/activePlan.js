angular.module('proton.dashboard')
    .directive('activePlan', ($rootScope, CONSTANTS, subscriptionModel) => {
        const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
        const PLANS = ['free', PLUS, PROFESSIONAL, VISIONARY];

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
