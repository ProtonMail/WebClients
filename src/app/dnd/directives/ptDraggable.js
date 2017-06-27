angular.module('proton.dnd')
    .directive('ptDraggable', ($rootScope, ptDndModel, ptDndUtils, PTDNDCONSTANTS, ptDndNotification) => {

        const { CLASSNAME, DROPZONE_ATTR_ID } = PTDNDCONSTANTS;
        let getSelected = angular.noop;

        document.addEventListener('dragstart', (event) => {

            // Check drag a draggable item
            const target = ptDndUtils.getDragInitiatorNode(event.target);
            const eventData = (event.dataTransfer || event.originalEvent.dataTransfer);

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
            if (target.nodeType !== 1 || target.classList.contains(CLASSNAME.DRAG_HOVER) || !target.hasAttribute(DROPZONE_ATTR_ID)) {
                return;
            }

            // Remove the className for previous hovered items
            angular.element(document.querySelectorAll(`.${CLASSNAME.DRAG_HOVER}`))
                .removeClass(CLASSNAME.DRAG_HOVER);
            target.classList.add(CLASSNAME.DRAG_HOVER);
        });

        document.addEventListener('dragleave', ({ target }) => {
            if (target.nodeType === 1 && target.classList.contains(CLASSNAME.DRAG_HOVER)) {
                target.classList.remove(CLASSNAME.DRAG_HOVER);
            }
        });

        document.addEventListener('dragend', () => {
            document.body.classList.remove(CLASSNAME.BODY);
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
                        !scope.conversation.Selected && $rootScope.numberElementChecked++;

                        // To keep the $scope up to date as we cannot display the notifcation after the digest
                        const value = $rootScope.numberElementChecked;
                        scope.$applyAsync(() => {
                            scope.conversation.Selected = true;
                            $rootScope.numberElementChecked = value;
                            this.onDragStart(target, event, getSelected());
                        });
                    }
                });
            }
        };
    });
