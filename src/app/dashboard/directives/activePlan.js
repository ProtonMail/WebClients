import _ from 'lodash';

import { PLANS } from '../../constants';

const { PLUS, PROFESSIONAL, VISIONARY } = PLANS.PLAN;

/* @ngInject */
function activePlan(dispatchers, subscriptionModel) {
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
