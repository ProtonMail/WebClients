angular.module('proton.ui')
    .directive('protonmailLogo', (authentication, CONSTANTS, organizationModel, subscriptionModel, $rootScope) => {
        return {
            restrict: 'E',
            templateUrl: 'templates/directives/ui/protonmailLogo.tpl.html',
            replace: true,
            link(scope, element) {
                const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
                const PLANS = [PLUS, PROFESSIONAL, VISIONARY].join(' ');
                const unsubscribes = [];

                unsubscribes.push($rootScope.$on('organizationChange', () => updateLogo()));
                unsubscribes.push($rootScope.$on('updateUser', () => updateLogo()));

                updateLogo();

                function updateLogo() {
                    const organization = organizationModel.get();
                    const subscription = subscriptionModel.get();
                    const isLifetime = subscription.CouponCode === 'LIFETIME';
                    const isSubuser = authentication.user.subuser;
                    const isMember = authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
                    let planName = organization.PlanName;

                    if (isLifetime) { planName = 'lifetime'; }
                    if (isSubuser || isMember || planName === 'free') { planName = ''; }
                    element.removeClass(PLANS).addClass(planName);
                    element.attr('data-plan-name', planName);
                }

                scope.$on('$destroy', () => {
                    unsubscribes.forEach((callback) => callback());
                    unsubscribes.length = 0;
                });
            }
        };
    });
