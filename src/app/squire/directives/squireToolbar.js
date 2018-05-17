import _ from 'lodash';
import { flow, filter, reduce } from 'lodash/fp';
import { DEFAULT_SQUIRE_VALUE } from '../../constants';
import { findParent } from '../../../helpers/domHelper';

/* @ngInject */
function squireToolbar(editorState, editorModel) {
    const { HEADER_CLASS } = DEFAULT_SQUIRE_VALUE;

    const CLASSNAME = {
        CONTAINER: 'squireToolbar-container squire-toolbar',
        SUB_ROW: 'squireToolbar-show-subrow',
        insertImage: 'open-image',
        makeLink: 'open-link'
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
                    filter((i) => i && /^blockquote$|^i$|^u$|^b$|^ul$|^ol$|^li$|.align-(center|left|right)$/i.test(i)),
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

                node.className = [
                    CLASSNAME.CONTAINER,
                    classNames,
                    subRowClass,
                    popoverImage,
                    popoverLink,
                    directionClass
                ]
                    .filter(Boolean)
                    .join(' ');
            }
        }, 100);

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/squireToolbar.tpl.html'),
        link(scope, $el) {
            const ID = scope.message.ID;
            const el = $el[0];

            const hideRow = () => el.classList.remove(CLASSNAME.SUB_ROW);
            const closeAllPopups = () => editorState.set(ID, { popover: undefined });

            const onRowClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                el.classList.toggle(CLASSNAME.SUB_ROW);
                closeAllPopups();
            };

            const isInsidePopup = (node) =>
                findParent(
                    node,
                    (parent) =>
                        parent.dataset &&
                        (parent.dataset.squirePopover !== undefined ||
                            parent.dataset.squireDropdown !== undefined ||
                            parent.dataset.squirePreventClose !== undefined)
                );
            const clickAnywhereClose = ({ target }) => {
                if (target.dataset.squireActions || isInsidePopup(target)) {
                    return;
                }
                closeAllPopups();
            };

            const onStateChange = ({ popover: oldPopover }, { popover }) => {
                if (oldPopover === 'makeLink' || oldPopover === 'insertImage') {
                    el.classList.remove(CLASSNAME[oldPopover]);
                }
                if (popover === 'makeLink' || popover === 'insertImage') {
                    // When opening the makelink or insert image popover, hide the 2nd row
                    hideRow();
                    el.classList.add(CLASSNAME[popover]);
                }
            };

            const { editor } = editorModel.find(scope.message);
            const onPathChange = onPathChangeCb(el, editor);
            const rowButton = el.querySelector('.squireToolbar-action-options');

            // Needs to be initialized with the default editor mode.
            onStateChange({}, editorState.get(ID));
            editorState.on(ID, onStateChange, ['popover']);
            // Initialize the current path for pre-defined states.
            onPathChange();
            editor.addEventListener('pathChange', onPathChange);
            rowButton.addEventListener('mousedown', onRowClick);
            document.addEventListener('click', clickAnywhereClose);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);
                editor.removeEventListener('pathChange', onPathChange);
                rowButton.removeEventListener('mousedown', onRowClick);
                document.removeEventListener('click', clickAnywhereClose);
            });
        }
    };
}

export default squireToolbar;
