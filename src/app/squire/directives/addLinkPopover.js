import { DEFAULT_SQUIRE_VALUE, REGEX_EMAIL } from '../../constants';

const LINK_DEFAULT = DEFAULT_SQUIRE_VALUE.LINK;
const CLASS_HIDDEN = 'addLinkPopover-hidden';
const CLASS_UPDATE = 'addLinkPopover-editable';

/* @ngInject */
function addLinkPopover(editorModel, editorState, squireExecAction) {
    const getSelectionEditor = (message) => {
        const { editor } = editorModel.find(message);
        return {
            editor,
            selection: editor && editor.getSelection()
        };
    };

    /**
     * Found the image if there is one inside the current selection
     * @param  {Message} message
     * @return {Node}
     */
    const getSelectedImg = (message) => {
        const { selection, editor } = getSelectionEditor(message);

        if (editor) {
            return angular
                .element(selection.commonAncestorContainer)
                .find('img')
                .filter(function() {
                    /* eslint no-underscore-dangle: "off" */
                    const range = editor._win.getSelection().getRangeAt(0);
                    if (!range || !range.commonAncestorContainer) {
                        return false;
                    }
                    return range.commonAncestorContainer.contains(this);
                })[0];
        }
    };

    /**
     * Get the current link at the cursor or the current selected item
     * @param  {Message} message
     * @return {Object}         {href: textContent};
     */
    function getLinkAtCursor(message) {
        const { selection, editor } = getSelectionEditor(message);
        const config = { href: LINK_DEFAULT, textContent: LINK_DEFAULT };

        if (!editor) {
            return config;
        }

        return (
            angular.element(selection.commonAncestorContainer).closest('a')[0] || {
                ...config,
                textContent: selection.toString()
            }
        );
    }

    /**
     * Format a link to append a mailto or http before it
     * @param  {String} input
     * @return {String}
     */
    const formatLink = (input = '') => {
        if (REGEX_EMAIL.test(input)) {
            return /mailto/.test(input) ? input : `mailto:${input}`.trim();
        }

        if (/^http(|s):/.test(input)) {
            return input;
        }

        return `http://${input}`;
    };

    const isUpdate = (link = LINK_DEFAULT) => link && link !== LINK_DEFAULT;

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/addLinkPopover.tpl.html'),
        link(scope, $el) {
            const ID = scope.message.ID;
            const el = $el[0];

            const onStateChange = ({ popover: oldPopover }, { popover }) => {
                if (popover === 'makeLink') {
                    const link = getLinkAtCursor(scope.message);
                    el.urlLink.value = link.href;
                    el.labelLink.value = link.textContent;
                    el.classList.remove(CLASS_HIDDEN);

                    if (isUpdate(el.urlLink.value)) {
                        el.classList.add(CLASS_UPDATE);
                    } else {
                        el.classList.remove(CLASS_UPDATE);
                    }

                    return _rAF(() => el.querySelector('input').focus());
                }

                if (oldPopover === 'makeLink') {
                    el.classList.add(CLASS_HIDDEN);
                }
            };

            const onClick = ({ target }) => {
                if (/update|add/.test(target.name)) {
                    return squireExecAction.makeLink(scope.message, {
                        link: formatLink(el.urlLink.value),
                        title: el.labelLink.value,
                        wrap: getSelectedImg(scope.message)
                    });
                }

                if (target.name === 'remove') {
                    squireExecAction.removeLink(scope.message);
                }
            };

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            editorState.on(ID, onStateChange, ['popover']);

            el.addEventListener('submit', onSubmit);
            el.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);

                el.removeEventListener('submit', onSubmit);
                el.removeEventListener('click', onClick);
            });
        }
    };
}

export default addLinkPopover;
