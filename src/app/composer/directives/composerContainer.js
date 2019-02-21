import _ from 'lodash';

/* @ngInject */
function composerContainer(authentication, composerRender, composerLoader, dispatchers) {
    return {
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const focusMessage = composerLoader(scope);
            const renderList = (data) => {
                const $list = [].slice.call(el[0].querySelectorAll('.composer-container'));
                _rAF(() => composerRender.render($list, data));
            };

            const openClose = (type, data = {}) => {
                scope.$applyAsync(() => {
                    if (scope.messages.length) {
                        const message = type === 'close' ? scope.messages[0] : data.message;
                        /*
                                Can come from a deffered promise and before the actual new composer
                                is rendered if you click compose too fast
                             */
                        message.focussed = false;

                        const { index, composer } = composerRender.findComposer(el[0], message);
                        // As the $digest is way too slow, the composer is not always removed from the dom.
                        const position = index - 1 >= 0 ? index - 1 : index;
                        const state = angular.extend({}, data, {
                            message,
                            composer,
                            index: position,
                            size: scope.messages.length,
                            keepState: false
                        });
                        focusMessage(state);

                        // Add a delay to ensure the previous composer is removed on close
                        const id = setTimeout(() => (renderList(state), clearTimeout(id)), 160);
                    }
                });
            };

            const onOrientationChange = () => openClose('close');
            window.addEventListener('orientationchange', onOrientationChange, false);

            on('composer.update', (e, { type, data }) => {
                switch (type) {
                    case 'focus.dragenter':
                    case 'focus.click':
                        scope.$applyAsync(() => focusMessage(data));
                        break;

                    case 'focus.first': {
                        const notMinimized = _.find(scope.messages, { minimized: false });
                        notMinimized && openClose(type, { message: notMinimized });
                        break;
                    }

                    case 'escape.autocomplete': {
                        const hasHotkeys = authentication.user.Hotkeys === 1;
                        const message = _.find(scope.messages, { focussed: true });

                        if (hasHotkeys && message) {
                            scope.close(message, false, true); // message, discard, save
                        }

                        break;
                    }

                    case 'close':
                        openClose(type, data);
                        break;

                    case 'refresh':
                        renderList(data);
                        break;

                    case 'editor.loaded':
                    case 'editor.focus': {
                        const { message, editor, isMessage } = data;
                        // If it's not an editor from the composer but signature etc.
                        if (!isMessage) {
                            break;
                        }

                        if (message.focussed) {
                            scope.$applyAsync(() => (message.autocompletesFocussed = false));
                            break;
                        }
                        scope.$applyAsync(() => {
                            const { index, composer } = composerRender.findComposer(el[0], message);
                            const state = angular.extend({}, data, {
                                composer,
                                index,
                                keepState: false,
                                focusEditor: type === 'editor.focus',
                                size: scope.messages.length
                            });
                            focusMessage(state, editor);

                            // Only re-render when we load a new composer
                            type === 'editor.loaded' && renderList(state);
                        });
                        break;
                    }
                }
            });

            scope.$on('$destroy', () => {
                window.removeEventListener('orientationchange', onOrientationChange, false);
                unsubscribe();
            });
        }
    };
}
export default composerContainer;
