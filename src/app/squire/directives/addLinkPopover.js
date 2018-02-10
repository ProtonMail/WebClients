import _ from 'lodash';

/* @ngInject */
function addLinkPopover(editorModel, editorState, CONSTANTS, squireExecAction, regexEmail) {
    const { DEFAULT_SQUIRE_VALUE } = CONSTANTS;
    const LINK_DEFAULT = DEFAULT_SQUIRE_VALUE.LINK;
    const CLASS_HIDDEN = 'addLinkPopover-hidden';
    const CLASS_UPDATE = 'addLinkPopover-editable';

    /**
     * Get the current link at the cursor or the current selected item
     * @param  {Message} message
     * @return {Object}         {href: textContent};
     */
    function getLinkAtCursor(message) {
        const { editor } = editorModel.find(message);
        const config = { href: LINK_DEFAULT, textContent: LINK_DEFAULT };
        if (!editor) {
            return config;
        }
        const selection = editor.getSelection();
        return (
            angular.element(selection.commonAncestorContainer).closest('a')[0] ||
            _.extend({}, config, {
                textContent: selection.toString()
            })
        );
    }

    /**
     * Format a link to append a mailto or http before it
     * @param  {String} input
     * @return {String}
     */
    const formatLink = (input = '') => {
        if (regexEmail.test(input)) {
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
                } else if (oldPopover === 'makeLink') {
                    el.classList.add(CLASS_HIDDEN);
                }
            };

            const onClick = ({ target }) => {
                switch (target.name) {
                    case 'update':
                    case 'add':
                        squireExecAction.makeLink(scope.message, formatLink(el.urlLink.value), el.labelLink.value);
                        break;
                    case 'remove':
                        squireExecAction.removeLink(scope.message);
                        break;
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
