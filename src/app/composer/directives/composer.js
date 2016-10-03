angular.module('proton.composer')
    .directive('composer', ($rootScope, embedded, attachmentFileFormat) => {

        const CLASS_DRAGGABLE = 'composer-draggable';
        const CLASS_DRAGGABLE_EDITOR = 'composer-draggable-editor';

        const addDragenterClassName = (el, className = CLASS_DRAGGABLE) => el.classList.add(className);
        const addDragleaveClassName = (el) => {
            el.classList.remove(CLASS_DRAGGABLE);
            el.classList.remove(CLASS_DRAGGABLE_EDITOR);
        };

        const isMessage = ({ ID }, { message = {}, messageID }) => {
            return ID === messageID || ID === message.ID;
        };

        /**
         * Parse actions for the message and trigger some actions
         * @param  {$scope} scope
         * @param  {Node} el)
         * @return {Function}       (<event>, <data:Object>) callback from $rootScope
         */
        const onAction = (scope, el) => (e, { type, data }) => {

            if (!isMessage(scope.message, data)) {
                return;
            }

            switch(type) {
                case 'dragenter':
                    if (attachmentFileFormat.isUploadAbleType(data.event)) {
                        addDragenterClassName(el);
                    }
                    break;
                case 'drop':
                    // Same event as the one coming from squire
                    if (e.name === 'attachment.upload' && data.queue.files.length && data.queue.hasEmbedded) {
                        return addDragenterClassName(el, CLASS_DRAGGABLE_EDITOR);
                    }
                    addDragleaveClassName(el);
                    break;
                case 'upload':
                    addDragleaveClassName(el);
                    break;
                case 'upload.success':
                    _rAF(() => addDragleaveClassName(el));
                    scope.message.editor && _.chain(data.upload)
                        .filter(({ attachment = {} }) => attachment.Headers['content-disposition'] === 'inline')
                        .each(({ cid, url }) => {
                            // If we close the composer the editor won't exist anymore but maybe we were uploading an attchement
                            scope.message.editor.fireEvent('refresh', {
                                action: 'attachment.embedded',
                                data: { url, cid }
                            });

                        });
                    break;

                case 'remove.embedded':
                    scope.message.editor.fireEvent('refresh', {
                        action: 'attachment.remove',
                        data: data.attachment.Headers
                    });
                    break;
            }
        };


        return {
            replace: true,
            templateUrl: 'templates/directives/composer/composer.tpl.html',
            link(scope, el) {

                const onDragEnter = () => addDragenterClassName(el[0]);
                const onDragLeave = _.debounce(({ target }) => {
                    target.classList.contains('composer-dropzone') && addDragleaveClassName(el[0]);
                }, 16);

                el.on('dragenter', onDragEnter);
                el.on('dragleave', onDragLeave);

                const unsubscribeEditor = $rootScope.$on('editor.draggable', onAction(scope, el[0]));
                const unsubscribeAtt = $rootScope.$on('attachment.upload', onAction(scope, el[0]));

                scope
                    .$on('$destroy', () => {
                        el.off('dragenter', onDragEnter);
                        el.off('dragleave', onDragLeave);

                        unsubscribeEditor();
                        unsubscribeAtt();
                    });
            }
        };
    });

