import _ from 'lodash';

/* @ngInject */
const squireActions = ($rootScope) => ({
    link(scope, el, { squireActions, squireActionsType = 'mousedown' }) {
        const onMouseDown = (e) => {
            const target = e.target;
            // This is to be enable scrolling with the mouse click, for example on the dropdown.
            if (target.dataset.squireIgnore) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const emitOptions = {
                type: 'squireActions',
                data: {
                    action: squireActions,
                    message: scope.message
                }
            };
            /**
             * Emit the action with value arguments if data-value is defined on the element.
             * This enables it to be more flexible, i.e. it can both used as a list and as
             * a single element.
             */
            if (_.has(target.dataset, 'value')) {
                emitOptions.data.argument = {
                    value: target.dataset.value,
                    label: target.textContent.trim()
                };
            }

            $rootScope.$emit('squire.editor', emitOptions);
        };

        /**
         * The squireActionsType is the event for which to listen to.
         * Special case for the `moreToggle` which needs to listen to the "click" event
         * to steal focus from the editor to make the toggle mode editor work properly.
         */
        el.on(squireActionsType, onMouseDown);

        scope.$on('$destroy', () => {
            el.off(squireActionsType, onMouseDown);
        });
    }
});
export default squireActions;
