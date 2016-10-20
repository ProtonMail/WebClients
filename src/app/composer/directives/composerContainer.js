angular.module('proton.composer')
    .directive('composerContainer', ($rootScope, tools) => {

        /**
         * Compute some informations about a composer
         * @param  {Node} element A composer
         * @param  {Integer} count   Total message
         * @return {Object}
         */
        function sizes(element, count) {
            const width = element.offsetWidth;
            const margin = document.documentElement.classList.contains('ua-windows_nt') ? 40 : 20;
            const windowWidth = document.body.offsetWidth;
            const isBootstrap = tools.findBootstrapEnvironment() === 'xs';
            let overlap = 0;

            if (!isBootstrap && ((windowWidth / count) < width)) {
                /* overlap is a ratio that will share equaly the space available between overlayed composers. */
                overlap = ((windowWidth - width - (2 * margin)) / (count - 1));
            }

            return {
                width, margin, windowWidth,
                isBootstrap, overlap
            };
        }

        /**
         * Compute the right position of the composer
         * @param  {Integer} options.width
         * @param  {Integer} options.margin
         * @param  {Number} options.overlap
         * @param  {Integer} index           Current composer position
         * @return {Integer}                 Create a blured component if it's not an integer
         */
        function getPositionRight({ width, margin, overlap }, index) {
            const right = (overlap) ? (index * overlap) : (index * (width + margin) + margin);
            return parseInt(right, 10) || margin;
        }

        /**
         * Attach custom styles to a composer
         * @param  {Node} element composer
         * @param  {Object} styles  Style to bind
         * @return {void}
         */
        function bindStyles(element, styles) {
            Object
                .keys(styles)
                .forEach((key) => element.style[key] = styles[key]);
        }

        /**
         * Render each composer
         * @param  {Array} $list NodeList (composer) as an Array
         * @param  {Number} options.size Number of composer
         * @return {void}
         */
        function render($list, { size = 1 } = {}) {
            $list
                .forEach((node, index) => {
                    const config = sizes(node, size);
                    const styles = { visibility: 'visible' };

                    // Better for rendering
                    styles.transform = `translateX(-${getPositionRight(config, index)}px)`;

                    if (config.isBootstrap) {
                        styles.top = '80px';
                    }

                    bindStyles(node, styles);
                });
        }

        /**
         * Find the current composer to focus by its target
         * @param  {Node} node   Container of all the composer
         * @param  {Node} target
         * @return {Object}        {composer: <Node>, index: <Number>}
         */
        function findFocusedComposer(node, target) {
            const $list = [].slice.call(node.querySelectorAll('.composer'));
            return $list
                .reduce((acc, node, index) => {
                    return node.contains(target) ? { composer: node, index } : acc;
                }, { composer: null, index: -1 });
        }

        /**
         * Find the message attach to the composer
         * @param  {Array}  list     List of message
         * @param  {Node} composer
         * @return {Ressource}
         */
        function findMessagePerComposer(list = [], composer = null) {
            return (composer && _.findWhere(list, { uid: +composer.id.slice(3) }));
        }

        /**
         * Custom focus to the composer depending of the source from the click event
         *     - Fix issue with the templating (Todo refacto HTML composer to improve KISS)
         *     - Allow the user to focus as fast we can, onLoad we add a delay after $compile to ensure the focus
         * @param  {Angular.element} el             Composer
         * @param  {scope} scope
         * @param  {Squire} editor
         * @return {void}
         */
        function customFocus(el, scope, editor) {
            // Add a delay to ensure that the dom is ready onLoad
            const id = setTimeout(() => {
                clearTimeout(id);

                const { ToList = [], CCList = [], BCCList = [], IsEncrypted } = scope.selected;

                if (![].concat(ToList).concat(CCList).concat(BCCList).length && !IsEncrypted) {

                    const input = el.find('.toRow').find('input').eq(0);
                    if (input.get(0)) {
                        return scope.$applyAsync(() => {
                            scope.selected.autocompletesFocussed = true;
                            _rAF(() => input.focus());
                        });
                    }
                }

                if (!scope.selected.Subject.length) {
                    return el.find('.subject').focus();
                }

                _rAF(() => editor.focus());
            }, 300);
        }

        function renderFocusedComposer(scope, node) {
            return (target, editor, keepState) => {
                const { index, composer } = findFocusedComposer(node, target);
                const message = findMessagePerComposer(scope.messages, composer);
                const length = scope.messages.length;

                if (!length || message.focussed) {
                    return;
                }

                _.each(scope.messages, (msg, iteratee) => {
                    msg.focussed = false;
                    if (iteratee > index) {
                        msg.zIndex = (length - (iteratee - index)) * 100;
                    } else {
                        msg.zIndex = length * 100;
                    }
                });

                message.focussed = true;
                message.editor = message.editor || editor;

                scope.selected = message;
                !keepState && (scope.selected.autocompletesFocussed = false);

                return { composer, message };
            };
        }

        return {
            link(scope, el) {

                const focusedMessage = renderFocusedComposer(scope, el[0]);

                /**
                 * Find an focus the current composer
                 * @param  {Node} target Current source (clicked)
                 * @param  {Squire} editor Editor
                 * @return {void}
                 */
                const focusComposer = (target, editor, isFocusEditor) => {

                    const { composer, message } = focusedMessage(target, editor);

                    // It's coming from squire so let's focus it
                    if (isFocusEditor) {
                        return editor.focus();
                    }

                    customFocus(angular.element(composer), scope, editor || message.editor);
                };

                const onClick = ({ target }) => scope.$applyAsync(() => focusedMessage(target, null, true));

                const onOrientationChange = () => {
                    scope.$applyAsync(() => {
                        scope.messages.length && focusComposer(el[0].querySelector('.composer'));
                    });
                };

                el.on('click', onClick);
                window.addEventListener('orientationchange', onOrientationChange, false);

                const unsubscribe = $rootScope
                    .$on('composer.update', (e, { type, data }) => {

                        switch (type) {

                            case 'focus.first':
                                scope.$applyAsync(() => {
                                    if (scope.messages.length) {
                                        /*
                                            Can come from a deffered promise and before the actual new composer
                                            is rendered if you click compose too fast
                                         */
                                        const composer = el[0].querySelector('.composer');
                                        composer && focusComposer(composer);
                                    }
                                });
                                break;

                            case 'editor.loaded':
                            case 'editor.focus': {

                                const { message, editor, element, isMessage } = data;

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
                                        focusComposer(element[0], editor, type === 'editor.focus');
                                    });
                                break;
                            }

                            default:
                                // Need to perform the rendering after the $digest to match each new composer
                                scope
                                    .$applyAsync(() => {
                                        const $list = [].slice.call(el[0].querySelectorAll('.composer-container'));
                                        _rAF(() => render($list, data));
                                    });
                        }

                    });

                scope.$on('$destroy', () => {
                    window.removeEventListener('orientationchange', onOrientationChange, false);
                    el.off('click', onClick);
                    unsubscribe();
                });
            }
        };

    });

