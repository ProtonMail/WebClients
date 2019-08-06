import { PLANS, PAID_MEMBER_ROLE } from '../../constants';

const { PLUS, PROFESSIONAL, VISIONARY } = PLANS.PLAN;
const PLANS_LIST = [PLUS, PROFESSIONAL, VISIONARY].join(' ');
const PLANS_LIST_FILL = ['fill-plus', 'fill-professional', 'fill-visionary'].join(' ');

/* @ngInject */
function protonmailLogo(authentication, organizationModel, subscriptionModel, dispatchers) {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/ui/protonmailLogo.tpl.html'),
        replace: true,
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const planText = element[0].querySelector('#plan');

            on('organizationChange', updateLogo);
            on('updateUser', updateLogo);

            updateLogo();

            function updateLogo() {
                const organization = organizationModel.get();
                const subscription = subscriptionModel.get();
                const isLifetime = subscription.CouponCode === 'LIFETIME';
                const isSubuser = authentication.user.subuser;
                const isMember = authentication.user.Role === PAID_MEMBER_ROLE;

                let planName = organization.PlanName;
                const planClass = 'fill-' + planName.toLowerCase();
                const $planText = angular.element(planText);

                if (isLifetime) {
                    planName = 'lifetime';
                }
                if (isSubuser || isMember || planName === 'free') {
                    planName = '';
                }
                element.removeClass(PLANS_LIST).addClass(planName);
                $planText.removeClass(PLANS_LIST_FILL).addClass(planClass);
                planText.innerHTML = planName;
            }

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default protonmailLogo;
