import _ from 'lodash';

/* @ngInject */
function composer(AppModel, embedded, attachmentFileFormat, dispatchers, mailSettingsModel) {
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

    return {
        replace: true,
        templateUrl: require('../../../templates/directives/composer/composer.tpl.html'),
        link(scope, el) {
            const { dispatcher, on, unsubscribe } = dispatchers(['composer.update']);

            const focusComposer = (event, data = {}) => {
                dispatcher['composer.update'](`focus.${event}`, data);
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

                switch (type) {
                    case 'dragenter':
                        if (attachmentFileFormat.isUploadAbleType(data.event)) {
                            addDragenterClassName(el);
                            focusComposer('dragenter', {
                                message: scope.message,
                                composer: angular.element(el),
                                index: +el.getAttribute('data-index')
                            });
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
                        break;
                }
            };

            const onClick = ({ target }) => {
                if (!/composerHeader-btn/.test(target.classList.toString())) {
                    focusComposer('click', {
                        message: scope.message,
                        composer: el,
                        index: +el[0].getAttribute('data-index')
                    });
                }

                if (/squireToolbar/.test(target.classList.toString())) {
                    scope.$applyAsync(() => {
                        scope.message.ccbcc = false;
                    });
                }
            };

            const onDragLeave = _.debounce((e) => {
                const { target } = e;
                if (target.classList.contains('composer-dropzone') || target.classList.contains('composer-dropzone-wrapper')) {
                    if (AppModel.get('composerList').length > 1) {
                        !scope.message.focussed && addDragleaveClassName(el[0]);
                    } else {
                        addDragleaveClassName(el[0]);
                    }
                }
            }, 500);

            const onDragEnter = ({ originalEvent }) => {
                if (attachmentFileFormat.isUploadAbleType(originalEvent)) {
                    addDragenterClassName(el[0]);
                }
            };

            const onKeydown = ({ keyCode }) => {
                // ESC
                if (keyCode === 27) {
                    // Autocomplete input
                    if (document.activeElement && document.activeElement.classList.contains('autocompleteEmails-input')) {
                        return;
                    }
                    if (mailSettingsModel.get('Hotkeys') === 1) {
                        dispatcher['composer.update']('close.message', {
                            message: scope.message,
                            save: true
                        });
                    }
                }
            };

            el.on('dragenter', onDragEnter);
            el.on('dragleave', onDragLeave);
            el.on('click', onClick);
            el.on('keydown', onKeydown);

            on('editor.draggable', onAction(scope, el[0]));
            on('attachment.upload', onAction(scope, el[0]));

            scope.$on('$destroy', () => {
                el.off('dragenter', onDragEnter);
                el.off('dragleave', onDragLeave);
                el.off('click', onClick);
                el.off('keydown', onKeydown);

                unsubscribe();

                AppModel.set('activeComposer', false);
                AppModel.set('maximizedComposer', false);
                scope.selected = undefined;
            });
        }
    };
}
export default composer;
