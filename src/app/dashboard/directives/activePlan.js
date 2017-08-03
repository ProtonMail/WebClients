angular.module('proton.dashboard')
    .directive('activePlan', ($rootScope, CONSTANTS, subscriptionModel) => {
        const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
        const PLANS = _.reduce(['free', PLUS, PROFESSIONAL, VISIONARY], (acc, plan) => `${acc} ${plan}-active`, '');

        return {
            restrict: 'A',
            link(scope, element) {
                const update = () => element.removeClass(PLANS).addClass(subscriptionModel.name() + '-active');
                const unsubscribe = $rootScope.$on('subscription', (event, { type }) => {
                    (type === 'update') && update();
                });

                update();

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
