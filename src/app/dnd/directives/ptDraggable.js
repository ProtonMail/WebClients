import _ from 'lodash';

/* @ngInject */
function ptDraggable($rootScope, ptDndModel, ptDndUtils, PTDNDCONSTANTS, ptDndNotification) {
    const { CLASSNAME, DROPZONE_ATTR_ID } = PTDNDCONSTANTS;
    let getSelected = angular.noop;

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
            target.nodeType !== 1 ||
            target.classList.contains(CLASSNAME.DRAG_HOVER) ||
            !target.hasAttribute(DROPZONE_ATTR_ID)
        ) {
            return;
        }

        // Remove the className for previous hovered items
        angular.element(document.querySelectorAll(`.${CLASSNAME.DRAG_HOVER}`)).removeClass(CLASSNAME.DRAG_HOVER);
        target.classList.add(CLASSNAME.DRAG_HOVER);
    });

    document.addEventListener('dragleave', ({ target }) => {
        if (target.nodeType === 1 && target.classList.contains(CLASSNAME.DRAG_HOVER)) {
            target.classList.remove(CLASSNAME.DRAG_HOVER);
        }
    });

    document.addEventListener('dragend', (e) => {
        e.target.classList.remove(CLASSNAME.DRAG_START);
        document.body.classList.remove(CLASSNAME.BODY);
        angular
            .element(document.querySelectorAll(`.${CLASSNAME.DROPZONE_HOVER}`))
            .removeClass(CLASSNAME.DROPZONE_HOVER);

        angular.element(document.querySelectorAll(`.${CLASSNAME.DRAG_HOVER}`)).removeClass(CLASSNAME.DRAG_HOVER);
        ptDndModel.draggable.set('currentId', null);
    });

    return {
        link(scope, el) {
            getSelected = scope.getElements;
            const id = ptDndUtils.generateUniqId();

            el[0].setAttribute('draggable', true);
            el[0].setAttribute('data-pt-id', id);

            ptDndModel.draggable.set(id, {
                model: scope.conversation,
                type: scope.conversation.ConversationID ? 'message' : 'conversation',
                hookDragStart(target, event) {
                    const value = $rootScope.numberElementChecked;

                    if (scope.conversation.Selected) {
                        // To keep the $scope up to date as we cannot display the notifcation after the digest
                        return scope.$applyAsync(() => {
                            scope.conversation.Selected = true;
                            $rootScope.numberElementChecked = value;
                            this.onDragStart(target, event, getSelected());
                        });
                    }

                    /**
                     * Same behavior as gmail
                     * - 3 selected, select a 4th item, only select it and unselect others. On dragend, re-select the 3 others
                     */
                    $rootScope.$emit('dnd', {
                        type: 'hook.dragstart',
                        data: {
                            before: {
                                number: value,
                                ids: _.map(getSelected(), 'ID')
                            }
                        }
                    });

                    // To keep the $scope up to date as we cannot display the notifcation after the digest
                    scope.$applyAsync(() => {
                        scope.conversation.Selected = true;
                        $rootScope.numberElementChecked = 1;
                        this.onDragStart(target, event, [scope.conversation]);
                    });
                }
            });
        }
    };
}
export default ptDraggable;
