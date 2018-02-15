/* @ngInject */
function ptDropzone($rootScope, ptDndUtils, ptDndModel, PTDNDCONSTANTS) {
    const { CLASSNAME, DROPZONE_ATTR_ID } = PTDNDCONSTANTS;

    document.addEventListener('dragenter', ({ target }) => {
        // Filter by type for Firefox
        if (target.nodeType === 1 && target.hasAttribute(DROPZONE_ATTR_ID)) {
            angular.element(document.querySelectorAll(`.${CLASSNAME.DROPZONE_HOVER}`)).removeClass(CLASSNAME.DROPZONE_HOVER);

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

            angular.element(document.querySelectorAll(`.${CLASSNAME.DROPZONE_HOVER}`)).removeClass(CLASSNAME.DROPZONE_HOVER);

            angular.element(document.querySelectorAll(`.${CLASSNAME.DRAG_HOVER}`)).removeClass(CLASSNAME.DRAG_HOVER);
        }
    });

    return {
        type: 'A',
        link(scope, el) {
            const unsubscribe = [];

            const refresh = () => {
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
            };

            const id = setTimeout(() => (refresh(), clearTimeout(id)), 1000);

            unsubscribe.push(
                $rootScope.$on('labelsModel', (e, { type }) => {
                    if (type === 'cache.refresh' || type === 'cache.update') {
                        refresh();
                    }
                })
            );

            // Check the current state to set the current one as active
            unsubscribe.push(
                $rootScope.$on('$stateChangeSuccess', () => {
                    _rAF(refresh);
                })
            );

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default ptDropzone;
