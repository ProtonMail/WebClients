/* @ngInject */
function ptDropzone(dispatchers, ptDndUtils, ptDndModel, PTDNDCONSTANTS) {
    const { CLASSNAME, DROPZONE_ATTR_ID } = PTDNDCONSTANTS;

    document.addEventListener('dragenter', ({ target }) => {
        // Filter by type for Firefox
        if (target.nodeType === 1 && target.hasAttribute(DROPZONE_ATTR_ID)) {
            angular
                .element(document.querySelectorAll(`.${CLASSNAME.DROPZONE_HOVER}`))
                .removeClass(CLASSNAME.DROPZONE_HOVER);

            target.classList.add(CLASSNAME.DROPZONE_HOVER);
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();

        if (e.target.hasAttribute(DROPZONE_ATTR_ID)) {
            const dragItemId = e.target.getAttribute(DROPZONE_ATTR_ID);
            ptDndModel.dropzone.get(dragItemId).onDragOver(e.target, e);
            (e.dataTransfer || e.originalEvent.dataTransfer).dropEffect = 'move';

            return false;
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        document.body.classList.remove(CLASSNAME.BODY);

        // Drop only in dropZone container
        if (e.target.hasAttribute(DROPZONE_ATTR_ID) && ptDndModel.draggable.has('currentId')) {
            const dragElmId = e.target.getAttribute(DROPZONE_ATTR_ID);
            const { id } = JSON.parse((e.dataTransfer || e.originalEvent.dataTransfer).getData('Text'));

            // Hook drop
            ptDndModel.dropzone.get(dragElmId).onDropSuccess(e, id);
            ptDndModel.draggable.get(id).onDropItem(e);

            angular
                .element(document.querySelectorAll(`.${CLASSNAME.DROPZONE_HOVER}`))
                .removeClass(CLASSNAME.DROPZONE_HOVER);

            angular.element(document.querySelectorAll(`.${CLASSNAME.DRAG_HOVER}`)).removeClass(CLASSNAME.DRAG_HOVER);
        }
    });

    return {
        type: 'A',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            /**
             * There is a race-condition when a new menu label is added. It can happen that this function
             * is called BEFORE the label is added. Thus it's wrapped in rAF to delay it to be sure that
             * the added label element exists in the list.
             * @returns {*}
             */
            const refresh = () =>
                _rAF(() => {
                    ptDndModel.dropzone.reset();
                    [].slice.call(el[0].querySelectorAll('[data-pt-dropzone-item]')).forEach((node) => {
                        const id = ptDndUtils.generateUniqId('drop');
                        node.classList.add('ptDnd-dropzone-container');
                        node.setAttribute(DROPZONE_ATTR_ID, id);
                        ptDndModel.dropzone.set(id, {
                            value: node.dataset.ptDropzoneItem,
                            type: node.dataset.ptDropzoneItemType
                        });
                    });
                });

            const id = setTimeout(() => (refresh(), clearTimeout(id)), 1000);

            on('labelsModel', (e, { type }) => {
                if (type === 'cache.refresh' || type === 'cache.update') {
                    refresh();
                }
            });

            on('contactGroupModel', (e, { type }) => {
                if (type === 'cache.refresh' || type === 'cache.update') {
                    refresh();
                }
            });

            // Check the current state to set the current one as active
            on('$stateChangeSuccess', () => {
                _rAF(refresh);
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default ptDropzone;
