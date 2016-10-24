angular.module('proton.composer')
    .directive('composerContainer', ($rootScope, composerRender, composerLoader) => {
        return {
            link(scope, el) {

                const focusMessage = composerLoader(scope);
                const renderList = (data) => {
                    const $list = [].slice.call(el[0].querySelectorAll('.composer-container'));
                    _rAF(() => composerRender.render($list, data));
                };

                const openClose = (type, data = {}) => {
                    scope.$applyAsync(() => {
                        if (scope.messages.length) {

                            const message = (type === 'close') ? scope.messages[0] : data.message;
                            /*
                                Can come from a deffered promise and before the actual new composer
                                is rendered if you click compose too fast
                             */
                            message.focussed = false;

                            const { index, composer } = composerRender.findComposer(el[0], message);
                            const state = angular.extend({}, data, {
                                message, composer, index,
                                size: scope.messages.length,
                                keepState: false
                            });
                            focusMessage(state);
                            renderList(state);
                        }
                    });
                };

                const onOrientationChange = () => openClose('close');
                window.addEventListener('orientationchange', onOrientationChange, false);

                const unsubscribe = $rootScope.$on('composer.update', (e, { type, data }) => {

                    switch (type) {

                        case 'focus.click':
                            scope.$applyAsync(() => focusMessage(data));
                            break;

                        case 'loaded':
                        case 'close':
                            openClose(type, data);
                            break;

                        case 'editor.loaded':
                        case 'editor.focus': {

                            const { message, editor, isMessage } = data;

                            // If it's not an editor from the composer but signature etc.
                            if (!isMessage) {
                                break;
                            }

                            if (message.focussed) {
                                scope.$applyAsync(() => message.autocompletesFocussed = false);
                                break;
                            }

                            scope
                                .$applyAsync(() => {
                                    const { index, composer } = composerRender.findComposer(el[0], message);
                                    focusMessage(angular.extend({}, data, {
                                        composer, index, keepState: false,
                                        focusEditor: type === 'editor.focus'
                                    }), editor);
                                });
                            break;
                        }

                        default:
                            // Need to perform the rendering after the $digest to match each new composer
                            scope.$applyAsync(() => renderList(data));
                            break;
                    }


                });

                scope.$on('$destroy', () => {
                    window.removeEventListener('orientationchange', onOrientationChange, false);
                    unsubscribe();
                });
            }
        };

    });

