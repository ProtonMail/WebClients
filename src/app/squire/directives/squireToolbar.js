import _ from 'lodash';

import { flow, filter, reduce } from 'lodash/fp';

/* @ngInject */
function squireToolbar(CONSTANTS, squireDropdown, editorModel, onCurrentMessage, $rootScope) {
    const { HEADER_CLASS } = CONSTANTS.DEFAULT_SQUIRE_VALUE;

    const CLASSNAME = {
        CONTAINER: 'squireToolbar-container squire-toolbar',
        SUB_ROW: 'squireToolbar-show-subrow',
        POPOVER_IMAGE: 'open-image',
        POPOVER_LINK: 'open-link'
    };

    const getDefaultClass = (node, klass) => (node.classList.contains(CLASSNAME[klass]) ? CLASSNAME[klass] : '');

    const REGEX_DIRECTION = /\[(dir=(rtl|ltr))]/g;
    /**
     * Extract the direction class from the blocks in squire.
     * Example block: DIV.align-center[dir=rtl],
     * so extract the dir=rtl and replace the = with -
     * @param str
     * @returns {string}
     */
    const getDirectionClass = (str = '') => {
        const matches = REGEX_DIRECTION.exec(str);
        if (matches && matches.length >= 2) {
            return matches[1].replace('=', '-');
        }
        return 'dir-ltr';
    };
    /**
     * Strip away the direction attribute from the squire block.
     * @param str
     * @returns {string}
     */
    const stripDirectionAttribute = (str = '') => {
        return str.replace(REGEX_DIRECTION, '');
    };

    const onPathChangeCb = (node, editor) =>
        _.debounce(() => {
            const path = editor.getPath();
            /**
             * Have to strip away any text direction attribute from the path
             * otherwise the alignment classNames
             * in the chain below will not work.
             */
            const p = stripDirectionAttribute(path);

            if (p !== '(selection)') {
                const subRowClass = getDefaultClass(node, 'SUB_ROW');
                const popoverImage = getDefaultClass(node, 'POPOVER_IMAGE');
                const popoverLink = getDefaultClass(node, 'POPOVER_LINK');

                const directionClass = getDirectionClass(path);

                /**
                 * Find and filter selections to toogle the current action (toolbar)
                 * Filter by whitelist
                 * Ex: isBold etc.
                 */
                const classNames = flow(
                    filter((i) => i && /^i$|^u$|^b$|^ul$|^ol$|^li$|.align-(center|left|right)$/i.test(i)),
                    reduce((acc, path) => acc.concat(path.split('.')), []),
                    filter((i) => i && !/div|html|body|span/i.test(i)),
                    reduce((acc, key) => {
                        if (HEADER_CLASS === key) {
                            return `${acc} size`;
                        }
                        return `${acc} ${key.trim()}`;
                    }, '')
                )(p.split('>'))
                    .toLowerCase()
                    .trim();

                node.className = [CLASSNAME.CONTAINER, classNames, subRowClass, popoverImage, popoverLink, directionClass].filter(Boolean).join(' ');
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
        templateUrl: require('../../../templates/squire/squireToolbar.tpl.html'),
        link(scope, el) {
            const { editor } = editorModel.find(scope.message);
            const onPathChange = onPathChangeCb(el[0], editor);
            editor.addEventListener('pathChange', onPathChange);
            // Initialize the current path for pre-defined states.
            onPathChange();

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

            const toggleRow = (e) => {
                e.preventDefault();
                e.stopPropagation();
                el[0].classList.toggle(CLASSNAME.SUB_ROW);

                if (el[0].classList.contains(CLASSNAME.SUB_ROW)) {
                    squireDropdown(scope.message).matchSelection();

                    $rootScope.$emit('squire.editor', {
                        type: 'squire.toolbar',
                        data: {
                            action: 'display.subrow',
                            message: scope.message
                        }
                    });
                }
            };

            const rowButton = el[0].querySelector('.squireToolbar-action-options');

            const onResize = () => {
                squireDropdown(scope.message).closeAll();
                el[0].classList.remove(CLASSNAME.SUB_ROW);
            };

            rowButton.addEventListener('mousedown', toggleRow);
            $(window).on('resize', onResize);
            const unsubscribe = onCurrentMessage('squire.editor', scope, onActions);

            scope.$on('$destroy', () => {
                editor.removeEventListener('pathChange', onPathChange);
                rowButton.removeEventListener('mousedown', toggleRow);
                $(window).off('resize', onResize);
                unsubscribe();
                squireDropdown(scope.message).clear();
            });
        }
    };
}

export default squireToolbar;
