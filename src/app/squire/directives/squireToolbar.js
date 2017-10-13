angular.module('proton.squire')
    .directive('squireToolbar', (CONSTANTS, squireDropdown, editorModel, onCurrentMessage, $rootScope) => {

        const { HEADER_CLASS } = CONSTANTS.DEFAULT_SQUIRE_VALUE;

        const CLASSNAME = {
            CONTAINER: 'squireToolbar-container squire-toolbar',
            SUB_ROW: 'squireToolbar-show-subrow'
        };

        const onPathChangeCb = (node, editor) => _.debounce(() => {
            const p = editor.getPath();

            if (p !== '(selection)') {

                const subRowClass = node.classList.contains(CLASSNAME.SUB_ROW) ? CLASSNAME.SUB_ROW : '';

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

                node.className = `${CLASSNAME.CONTAINER} ${classNames} ${subRowClass}`.trim();
            }
        }, 100);

        return {
            replace: true,
            templateUrl: 'templates/squire/squireToolbar.tpl.html',
            link(scope, el) {

                const { editor } = editorModel.find(scope.message);
                const onPathChange = onPathChangeCb(el[0], editor);
                editor.addEventListener('pathChange', onPathChange);

                const onActions = (type, data) => {

                    if (type === 'squireActions' && /^(makeLink|insertImage)$/.test(data.action)) {
                        el[0].classList.remove(CLASSNAME.SUB_ROW);
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
