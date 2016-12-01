angular.module('proton.ui')
    .directive('protonmailLogo', () => {
        return {
            restrict: 'E',
            templateUrl: 'templates/directives/ui/protonmailLogo.tpl.html',
            replace: true,
            link(scope, element) {
                const img = element[0].querySelector('img');
                function updateLogo(organization) {
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
                    if (scope.subscription.CouponCode === 'LIFETIME') {
                        src = 'assets/img/logo/logo-lifetime.svg';
                    }
                    img.src = src;
                }
                scope.$on('organizationChange', (event, organization) => updateLogo(organization));
                updateLogo(scope.organization);
            }
        };
    });
