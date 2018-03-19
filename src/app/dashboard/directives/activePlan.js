import _ from 'lodash';

/* @ngInject */
function activePlan(CONSTANTS, dispatchers, subscriptionModel) {
    const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
    const PLANS = _.reduce(['free', PLUS, PROFESSIONAL, VISIONARY], (acc, plan) => `${acc} ${plan}-active`, '');

    return {
        restrict: 'A',
        link(scope, element) {
            const update = () => element.removeClass(PLANS).addClass(subscriptionModel.name() + '-active');
            const { on, unsubscribe } = dispatchers();

            on('subscription', (event, { type }) => {
                type === 'update' && update();
            });

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default activePlan;
