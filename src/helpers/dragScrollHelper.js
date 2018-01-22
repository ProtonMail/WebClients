import _ from 'lodash';

/**
 * Automatically scrolls the page when a user wants to drag an element up or down.
 *
 * @param {String} scrollableSelector the selector for which element has 'overflow: auto'
 * @param {Number} speed the speed in which to scroll
 * @param {Number} margin the margin in which to start scrolling
 * @returns {{dragStart(*=): undefined, dragMove(*, *, *=): undefined, dragEnd(): void}}
 */
const createScrollHelper = ({ scrollableSelector, speed = 10, margin = 20 } = {}) => {
    const model = {};

    return {
        /**
         * Dragstart needs to be passed the argument that ng-sortable uses for the event.
         *
         * @param {Object} event the drag start event (from ng-sortable)
         */
        dragStart(event) {
            /**
             * Get the list element form ng-sortable. It's stored far down in the object.
             * So in order to not break anything use _.get to safely retrieve it (in case ng-sortable
             * changes their internals).
             */
            const listElement = _.get(event, 'dest.sortableScope.element[0]');
            if (!listElement) {
                return;
            }
            // Find the scrollable container element as given from the selector.
            model.scrollableContainer = document.querySelector(scrollableSelector);
            // Get the y-positions where the list element begins and ends.
            model.listTop = listElement.offsetTop;
            model.listBottom = model.listTop + listElement.offsetHeight;
        },
        /**
         * Dragmove needs to be passed the same arguments as ng-sortable uses for the event.
         *
         * @param {Object} itemPosition the item position (from ng-sortable)
         * @param {Angular.element} containment the containment element (from ng-sortable)
         * @param {Object} eventObj the event object (from ng-sortable)
         */
        dragMove(itemPosition, containment, eventObj) {
            if (!eventObj || !model.scrollableContainer) {
                return;
            }

            // Get the current scroll y offset for the scroll container.
            const scrollY = model.scrollableContainer.scrollTop;
            // Get the y position where the scroll container starts, and how high it is.
            const scrollTop = model.scrollableContainer.offsetTop;
            const scrollHeight = model.scrollableContainer.offsetHeight;

            // Gets the current (relative to the page) and absolute (relative to the body) mouse y position.
            const currentY = eventObj.pageY;
            const absoluteY = currentY + scrollY;

            if (currentY - margin > scrollHeight && absoluteY <= model.listBottom) {
                model.scrollableContainer.scrollTop += speed;
            } else if (currentY - margin < scrollTop && absoluteY >= model.listTop) {
                model.scrollableContainer.scrollTop -= speed;
            }
        },
        dragEnd() {
            // Unset the container as to avoid memory leaks.
            delete model.scrollableContainer;
        }
    };
};

export default createScrollHelper;
