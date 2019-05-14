import { isElement } from '../../../helpers/domHelper';

/* @ngInject */
function ptDraggleCreator(AppModel, dispatchers, ptDndModel, ptDndUtils, PTDNDCONSTANTS, ptDndNotification) {
    const { CLASSNAME, DROPZONE_ATTR_ID } = PTDNDCONSTANTS;

    const removeClass = (selector, className) => {
        angular.element(document.querySelectorAll(`.${selector}`)).removeClass(className || selector);
    };

    document.addEventListener('dragstart', (event) => {
        // Check drag a draggable item
        const target = ptDndUtils.getDragInitiatorNode(event.target);

        // Not a ptDraggable item
        if (!target) {
            return ptDndModel.draggable.set('currentId', null);
        }

        const eventData = event.dataTransfer || event.originalEvent.dataTransfer;
        target.classList.add(CLASSNAME.DRAG_START);
        document.body.classList.add(CLASSNAME.BODY);
        eventData.effectAllowed = 'move';
        eventData.setData('Text', JSON.stringify({ id: target.dataset.ptId }));

        // Cache for the current id as the event seems to not be fast enougth
        ptDndModel.draggable.set('currentId', target.dataset.ptId);

        if (ptDndModel.draggable.has(target.dataset.ptId)) {
            const item = ptDndModel.draggable.get(target.dataset.ptId);
            item.hookDragStart(target, event);
            ptDndNotification.onDragStart(event, eventData, item.type);
        }

        return false;
    });

    document.addEventListener('dragenter', ({ target }) => {
        // Filter by type for Firefox
        if (
            !isElement(target) ||
            target.classList.contains(CLASSNAME.DRAG_HOVER) ||
            !target.hasAttribute(DROPZONE_ATTR_ID)
        ) {
            return;
        }

        // Remove the className for previous hovered items
        removeClass(CLASSNAME.DRAG_HOVER);
        target.classList.add(CLASSNAME.DRAG_HOVER);
    });

    document.addEventListener('dragleave', ({ target }) => {
        if (isElement(target) && target.classList.contains(CLASSNAME.DRAG_HOVER)) {
            target.classList.remove(CLASSNAME.DRAG_HOVER);
        }
    });

    document.addEventListener('dragend', (e) => {
        isElement(e.target) && e.target.classList.remove(CLASSNAME.DRAG_START);
        document.body.classList.remove(CLASSNAME.BODY);

        removeClass(CLASSNAME.DROPZONE_HOVER);
        removeClass(CLASSNAME.DRAG_HOVER);
        ptDndModel.draggable.set('currentId', null);
    });

    function main(link) {
        return {
            link(scope, el, attr) {
                const { dispatcher } = dispatchers(['dnd']);
                const id = ptDndUtils.generateUniqId();

                el[0].setAttribute('draggable', true);
                el[0].setAttribute('data-pt-id', id);

                link(
                    { scope, el, attr },
                    {
                        dispatcher,
                        id
                    }
                );
            }
        };
    }
    return main;
}
export default ptDraggleCreator;
