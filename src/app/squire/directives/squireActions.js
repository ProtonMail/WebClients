import _ from 'lodash';
import { hasTouch } from '../../../helpers/browser';

/* @ngInject */
const squireActions = (dispatchers) => ({
    link(scope, el, { squireActions, squireActionsType = 'mousedown' }) {
        const { dispatcher } = dispatchers(['squire.editor']);
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

            dispatcher['squire.editor'](emitOptions.type, emitOptions.data);
        };

        /**
         * The squireActionsType is the event for which to listen to.
         * Special case for the `moreToggle` which needs to listen to the "click" event
         * to steal focus from the editor to make the toggle mode editor work properly.
         *
         * Only listen to the click event for mobile browsers, so that they can properly handle
         * the event (#6599). Only enable the mousedown event for desktop browsers (#4955).
         */
        const event = hasTouch ? 'click' : squireActionsType;
        el.on(event, onMouseDown);

        scope.$on('$destroy', () => {
            el.off(event, onMouseDown);
        });
    }
});
export default squireActions;
