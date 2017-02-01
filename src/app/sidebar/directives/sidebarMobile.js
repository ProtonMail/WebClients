angular.module('proton.sidebar')
    .directive('sidebarMobile', (sidebarModel, $rootScope) => ({
        replace: true,
        scope: {},
        templateUrl: 'templates/partials/sidebar-responsive.tpl.html',
        link(scope) {
            scope.listStates = Object.keys(sidebarModel.getStateConfig());

            // Hide the sidebar with a delay for better perf on repaint
            scope.hideMobileSidebar = () => {
                const id = setTimeout(() => {
                    $rootScope.$emit('sidebarMobileToggle', false);
                    clearTimeout(id);
                }, 1000);
            };

            const unsubscribe = $rootScope.$on('$stateChangeStart', () => {
                $rootScope.$emit('sidebarMobileToggle', false);
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    }));
