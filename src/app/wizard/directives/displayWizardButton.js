angular.module('proton.wizard')
    .directive('displayWizardButton', ($rootScope) => ({
        link(scope, el, { displayWizardButton, displayPosition }) {
            /**
             * Emit an action on click with its name and the position you passed through
             * the attribute [data-display-position]
             */
            const onClick = () => $rootScope.$emit('tourActions', {
                action: displayWizardButton || 'tourStart',
                position: +displayPosition
            });
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    }));
