import _ from 'lodash';

/* @ngInject */
function composer(AppModel, attachmentFileFormat, dispatchers, mailSettingsModel) {
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
            const { dispatcher, on, unsubscribe } = dispatchers(['composer.update', 'editorListener']);
            const updateMini = (value) => (scope.mini = value);
            const updateSmall = (value) => (scope.small = value);

            const focusComposer = (event, data = {}) => {
                dispatcher['composer.update'](`focus.${event}`, data);
            };

            /**
             * On dragEnter, show the drop overlay and focus the composer if it is an uploadable file.
             * @param {Event} e
             */
            const onDragEnter = (e) => {
                if (scope.message.minimized) {
                    return;
                }
                if (!attachmentFileFormat.isUploadAbleType(e)) {
                    return;
                }
                addDragenterClassName(el[0]);
                focusComposer('dragenter', {
                    message: scope.message,
                    composer: el,
                    index: +el[0].getAttribute('data-index')
                });
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

                scope.message.touched = true;
                switch (type) {
                    case 'dragenter':
                        onDragEnter(data.event);
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
                const className = target.className;

                if (!/composerHeader-btn/.test(className)) {
                    focusComposer('click', {
                        message: scope.message,
                        composer: el,
                        index: +el[0].getAttribute('data-index')
                    });
                }

                if (/squireToolbar/.test(className)) {
                    scope.$applyAsync(() => {
                        scope.message.ccbcc = false;
                    });
                }

                if (/composer-btn-save/.test(className)) {
                    dispatcher.editorListener('pre.save.message', { message: scope.message });
                    return;
                }

                if (/composer-btn-send/.test(className)) {
                    dispatcher.editorListener('pre.send.message', { message: scope.message });
                    return;
                }

                if (/composer-btn-discard/.test(className)) {
                    scope.$applyAsync(() => scope.discard(scope.message));
                    return;
                }

                if (/composer-btn-encryption/.test(className)) {
                    scope.$applyAsync(() => scope.togglePanel(scope.message, 'encrypt'));
                    return;
                }

                if (/composer-btn-expiration/.test(className)) {
                    scope.$applyAsync(() => scope.togglePanel(scope.message, 'expiration'));
                }
            };

            const onDragLeave = _.debounce((e) => {
                const { target } = e;
                if (
                    target.classList.contains('composer-dropzone') ||
                    target.classList.contains('composer-dropzone-wrapper') ||
                    target.dataset.composerId === scope.message.ID // This can happen when the composers are overlapping
                ) {
                    addDragleaveClassName(el[0]);
                }
            }, 500);

            const onKeydown = ({ keyCode }) => {
                // ESC
                if (keyCode === 27) {
                    // Autocomplete input
                    if (
                        document.activeElement &&
                        document.activeElement.classList.contains('autocompleteEmails-input')
                    ) {
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

            el[0].addEventListener('dragenter', onDragEnter);
            el[0].addEventListener('dragleave', onDragLeave);
            el[0].addEventListener('click', onClick);
            el[0].addEventListener('keydown', onKeydown);

            on('editor.draggable', onAction(scope, el[0]));
            on('attachment.upload', onAction(scope, el[0]));
            on('AppModel', (event, { type, data = {} }) => {
                if (type === 'mini') {
                    scope.$applyAsync(() => {
                        updateMini(data.value);
                    });
                }

                if (type === 'small') {
                    scope.$applyAsync(() => {
                        updateSmall(data.value);
                    });
                }
            });

            updateMini(AppModel.get('mini'));
            updateSmall(AppModel.get('small'));

            scope.$on('$destroy', () => {
                el[0].removeEventListener('dragenter', onDragEnter);
                el[0].removeEventListener('dragleave', onDragLeave);
                el[0].removeEventListener('click', onClick);
                el[0].removeEventListener('keydown', onKeydown);

                unsubscribe();

                AppModel.set('activeComposer', false);
                AppModel.set('maximizedComposer', false);
                scope.selected = undefined;
            });
        }
    };
}
export default composer;
