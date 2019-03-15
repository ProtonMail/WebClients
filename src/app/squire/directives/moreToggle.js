import { MIME_TYPES } from '../../constants';

const { DEFAULT, PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function moreToggle(gettextCatalog, onCurrentMessage, editorState, translator) {
    const IS_OPEN = 'squireDropdown-is-open';

    const I18N = translator(() => ({
        [PLAINTEXT]: gettextCatalog.getString('Plain Text', null, 'Composer Mode'),
        [DEFAULT]: gettextCatalog.getString('Normal', null, 'Composer Mode')
    }));

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/moreToggle.tpl.html'),
        link(scope, $el) {
            const ID = scope.message.ID;
            const el = $el[0];
            const button = el.querySelector('.squireToolbar-action-modeEditor');

            const onStateChange = ({ popover: oldPopover, editorMode: oldEditorMode }, { popover, editorMode }) => {
                if (oldEditorMode !== editorMode) {
                    button.textContent = I18N[editorMode];
                }
                if (popover === 'moreToggle') {
                    el.classList.add(IS_OPEN);
                } else if (oldPopover === 'moreToggle') {
                    el.classList.remove(IS_OPEN);
                }
            };

            const unsubscribe = onCurrentMessage('squire.toggleMode', scope, (type) => {
                if (type === 'enableToggle' || type === 'disableToggle') {
                    button.disabled = type === 'disableToggle';
                }
            });

            // Needs to be initialized with the default editor mode.
            onStateChange({}, editorState.get(ID));
            editorState.on(ID, onStateChange, ['popover', 'editorMode']);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);
                unsubscribe();
            });
        }
    };
}

export default moreToggle;
