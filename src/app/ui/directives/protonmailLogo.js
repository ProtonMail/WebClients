angular.module('proton.ui')
    .directive('protonmailLogo', (authentication, CONSTANTS, organizationModel, subscriptionModel, $rootScope) => {
        return {
            restrict: 'E',
            templateUrl: 'templates/directives/ui/protonmailLogo.tpl.html',
            replace: true,
            link(scope, element) {
                const img = element[0].querySelector('img');
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
                    let src;
                    switch (organization.PlanName) {
                        case 'free':
                            src = 'assets/img/logo/logo.svg';
                            break;
                        case 'plus':
                            src = 'assets/img/logo/logo-plus.svg';
                            break;
                        case 'visionary':
                            src = 'assets/img/logo/logo-visionary.svg';
                            break;
                        default:
                            src = 'assets/img/logo/logo.svg';
                            break;
                    }
                    if (isLifetime) {
                        src = 'assets/img/logo/logo-lifetime.svg';
                    }
                    if (isSubuser || isMember) {
                        src = 'assets/img/logo/logo.svg';
                    }
                    img.src = src;
                }

                scope.$on('$destroy', () => {
                    unsubscribes.forEach((callback) => callback());
                    unsubscribes.length = 0;
                });
            }
        };
    });
