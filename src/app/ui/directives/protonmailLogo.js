/* @ngInject */
function protonmailLogo(authentication, CONSTANTS, organizationModel, subscriptionModel, dispatchers) {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/ui/protonmailLogo.tpl.html'),
        replace: true,
        link(scope, element) {
            const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
            const PLANS = [PLUS, PROFESSIONAL, VISIONARY].join(' ');

            const { on, unsubscribe } = dispatchers();

            on('organizationChange', updateLogo);
            on('updateUser', updateLogo);

            updateLogo();

            function updateLogo() {
                const organization = organizationModel.get();
                const subscription = subscriptionModel.get();
                const isLifetime = subscription.CouponCode === 'LIFETIME';
                const isSubuser = authentication.user.subuser;
                const isMember = authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
                let planName = organization.PlanName;

                if (isLifetime) {
                    planName = 'lifetime';
                }
                if (isSubuser || isMember || planName === 'free') {
                    planName = '';
                }
                element.removeClass(PLANS).addClass(planName);
                element.attr('data-plan-name', planName);
            }

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default protonmailLogo;
