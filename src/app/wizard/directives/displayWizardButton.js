/* @ngInject */
const displayWizardButton = (dispatchers) => ({
    link(scope, el, { displayWizardButton, displayPosition }) {
        const { dispatcher } = dispatchers(['tourActions']);
        /**
         * Emit an action on click with its name and the position you passed through
         * the attribute [data-display-position]
         */
        const onClick = () =>
            dispatcher.tourActions({
                action: displayWizardButton || 'tourStart',
                position: +displayPosition
            });

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });
    }
});
export default displayWizardButton;
