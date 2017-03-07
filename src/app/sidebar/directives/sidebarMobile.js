angular.module('proton.sidebar')
    .directive('sidebarMobile', (sidebarModel, $rootScope, authentication, CONSTANTS) => ({
        replace: true,
        scope: {},
        templateUrl: 'templates/partials/sidebar-responsive.tpl.html',
        link(scope) {
            const unsubscribes = [];

            scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
            scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
            scope.listStates = Object.keys(sidebarModel.getStateConfig());

            // Hide the sidebar with a delay for better perf on repaint
            scope.hideMobileSidebar = () => {
                const id = setTimeout(() => {
                    $rootScope.$emit('sidebarMobileToggle', false);
                    clearTimeout(id);
                }, 1000);
            };

            unsubscribes.push($rootScope.$on('$stateChangeStart', () => {
                $rootScope.$emit('sidebarMobileToggle', false);
            }));

            unsubscribes.push($rootScope.$on('updateUser', () => {
                scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
                scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
            }));

            scope.$on('$destroy', () => {
                unsubscribes.forEach((cb) => cb());
                unsubscribes.length = 0;
            });
        }
    }));
