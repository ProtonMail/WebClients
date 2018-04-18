import { PLANS, PAID_MEMBER_ROLE } from '../../constants';

const { PLUS, PROFESSIONAL, VISIONARY } = PLANS.PLAN;
const PLANS_LIST = [PLUS, PROFESSIONAL, VISIONARY].join(' ');

/* @ngInject */
function protonmailLogo(authentication, organizationModel, subscriptionModel, dispatchers) {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/ui/protonmailLogo.tpl.html'),
        replace: true,
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();

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

                if (isLifetime) {
                    planName = 'lifetime';
                }
                if (isSubuser || isMember || planName === 'free') {
                    planName = '';
                }
                element.removeClass(PLANS_LIST).addClass(planName);
                element.attr('data-plan-name', planName);
            }

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default protonmailLogo;
