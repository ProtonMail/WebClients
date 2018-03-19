import _ from 'lodash';

/* @ngInject */
function composerOutside(dispatchers, attachmentFileFormat) {
    const CLASS_DRAGGABLE = 'composer-draggable';
    const CLASS_DRAGGABLE_EDITOR = 'composer-draggable-editor';

    const addDragenterClassName = (el, className = CLASS_DRAGGABLE) => el.classList.add(className);
    const addDragleaveClassName = (el) => {
        el.classList.remove(CLASS_DRAGGABLE);
        el.classList.remove(CLASS_DRAGGABLE_EDITOR);
    };

    /**
     * Parse actions for the message and trigger some actions
     * @param  {$scope} scope
     * @param  {Node} el)
     * @return {Function}       (<event>, <data:Object>) callback from $rootScope
     */
    const onAction = (scope, el) => (e, { type, data }) => {
        switch (type) {
            case 'dragenter':
                if (attachmentFileFormat.isUploadAbleType(data.event)) {
                    addDragenterClassName(el);
                }
                break;
            case 'drop':
                // Same event as the one coming from squire
                if (e.name === 'attachment.upload.outside' && data.queue.files.length && data.queue.hasEmbedded) {
                    return addDragenterClassName(el, CLASS_DRAGGABLE_EDITOR);
                }
                addDragleaveClassName(el);
                break;
            case 'upload':
                addDragleaveClassName(el);
                break;
            case 'attachments.limit.error':
            case 'upload.success':
                _rAF(() => addDragleaveClassName(el));
                break;
        }
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/directives/outside/composer.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const onDragEnter = ({ originalEvent }) => {
                if (attachmentFileFormat.isUploadAbleType(originalEvent)) {
                    addDragenterClassName(el[0]);
                }
            };
            const onDragLeave = _.debounce(({ target }) => {
                target.classList.contains('composer-dropzone') && addDragleaveClassName(el[0]);
            }, 16);

            el.on('dragenter', onDragEnter);
            el.on('dragleave', onDragLeave);

            on('editor.draggable', onAction(scope, el[0]));
            on('attachment.upload.outside', onAction(scope, el[0]));

            scope.$on('$destroy', () => {
                el.off('dragenter', onDragEnter);
                el.off('dragleave', onDragLeave);
                unsubscribe();
            });
        }
    };
}
export default composerOutside;
