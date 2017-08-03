angular.module('proton.dashboard')
    .directive('professionalColumn', (customProPlanModal) => {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/professionalColumn.tpl.html',
            link(scope, element) {
                const $buttons = element.find('.professionalColumn-customize');

                $buttons.on('click', onClick);

                function onClick() {
                    customProPlanModal.activate({
                        params: {
                            close() {
                                customProPlanModal.deactivate();
                            }
                        }
                    });
                }

                scope.$on('$destroy', () => {
                    $buttons.off('click', onClick);
                });
            }
        };
    });
