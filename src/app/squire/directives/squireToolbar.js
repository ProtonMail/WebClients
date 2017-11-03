angular.module('proton.squire')
    .directive('squireToolbar', (CONSTANTS, squireDropdown, editorModel, onCurrentMessage, $rootScope) => {

        const { HEADER_CLASS } = CONSTANTS.DEFAULT_SQUIRE_VALUE;

        const CLASSNAME = {
            CONTAINER: 'squireToolbar-container squire-toolbar',
            SUB_ROW: 'squireToolbar-show-subrow',
            POPOVER_IMAGE: 'open-image',
            POPOVER_LINK: 'open-link'
        };

        const getDefaultClass = (node, klass) => (node.classList.contains(CLASSNAME[klass]) ? CLASSNAME[klass] : '');
        const onPathChangeCb = (node, editor) => _.debounce(() => {
            const p = editor.getPath();

            if (p !== '(selection)') {

                const subRowClass = getDefaultClass(node, 'SUB_ROW');
                const popoverImage = getDefaultClass(node, 'POPOVER_IMAGE');
                const popoverLink = getDefaultClass(node, 'POPOVER_LINK');

                /**
                 * Find and filter selections to toogle the current action (toolbar)
                 * Filter by whitelist
                 * Ex: isBold etc.
                 */
                const classNames = _.chain(p.split('>'))
                    .filter((i) => i && /^i$|^u$|^b$|^ul$|^ol$|^li$|.align-(center|left|right)$/i.test(i))
                    .reduce((acc, path) => acc.concat(path.split('.')), [])
                    .filter((i) => i && !/div|html|body|span/i.test(i))
                    .reduce((acc, key) => {
                        if (HEADER_CLASS === key) {
                            return `${acc} size`;
                        }
                        return `${acc} ${key.trim()}`;
                    }, '')
                    .value()
                    .toLowerCase()
                    .trim();

                node.className = `${CLASSNAME.CONTAINER} ${classNames} ${subRowClass} ${popoverImage} ${popoverLink}`.trim();
            }
        }, 100);

        /**
         * Highlight btn matching the current popover openned
         * @param  {Element} node
         * @return {Object}      {toggle(<popoverName/actionName>), show(<popoverName/actionName>)}
         */
        const togglePopover = (node) => {

            const effect = (action) => (type) => {
                if (type === 'makeLink' || type === 'addLinkPopover') {
                    return node.classList[action](CLASSNAME.POPOVER_LINK);
                }
                node.classList[action](CLASSNAME.POPOVER_IMAGE);
            };

            return {
                toggle: effect('toggle'),
                hide: effect('remove')
            };
        };

        return {
            replace: true,
            templateUrl: 'templates/squire/squireToolbar.tpl.html',
            link(scope, el) {

                const { editor } = editorModel.find(scope.message);
                const onPathChange = onPathChangeCb(el[0], editor);
                editor.addEventListener('pathChange', onPathChange);

                const popoverBtn = togglePopover(el[0]);

                const onActions = (type, data) => {


                    if (type === 'squireActions' && /^(makeLink|insertImage)$/.test(data.action)) {
                        popoverBtn.toggle(data.action);
                        el[0].classList.remove(CLASSNAME.SUB_ROW);
                    }

                    if (type === 'popover.form' && /^close/.test(data.action)) {
                        popoverBtn.hide(data.name);
                    }

                    if (type === 'squire.native.action') {
                        squireDropdown(scope.message).update(data);

                        // Set the mode for the whole composer
                        if (data.action === 'setEditorMode') {
                            el[0].setAttribute('data-editor-text', data.argument.value);
                        }
                    }
                };

                const onClick = (e) => {

                    e.preventDefault();
                    e.stopPropagation();
                    const { target, currentTarget } = e;

                    if (target.nodeName === 'BUTTON') {
                        squireDropdown(scope.message).closeAll(target.dataset.key);
                    }

                    if (target.dataset.toggle === 'row') {
                        currentTarget.classList.toggle(CLASSNAME.SUB_ROW);

                        if (currentTarget.classList.contains(CLASSNAME.SUB_ROW)) {
                            squireDropdown(scope.message).matchSelection();

                            $rootScope.$emit('squire.editor', {
                                type: 'squire.toolbar',
                                data: {
                                    action: 'display.subrow',
                                    message: scope.message
                                }
                            });
                        }
                    }
                };

                const onResize = () => {
                    squireDropdown(scope.message).closeAll();
                    el[0].classList.remove(CLASSNAME.SUB_ROW);
                };

                el.on('click', onClick);
                $(window).on('resize', onResize);
                const unsubscribe = onCurrentMessage('squire.editor', scope, onActions);

                scope.$on('$destroy', () => {
                    editor.removeEventListener('pathChange', onPathChange);
                    el.off('click', onClick);
                    $(window).off('resize', onResize);
                    unsubscribe();
                    squireDropdown(scope.message).clear();
                });

            }
        };
    });
