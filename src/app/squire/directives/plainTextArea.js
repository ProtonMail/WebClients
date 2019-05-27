import _ from 'lodash';

import { SAVE_TIMEOUT_TIME } from '../../constants';

const KEY = {
    ENTER: 13,
    S: 83
};

/* @ngInject */
function plainTextArea(dispatchers, mailSettingsModel, hotkeys) {
    const isKey = (e, code) => !e.altKey && (e.ctrlKey || e.metaKey) && e.keyCode === code;

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/plainTextArea.tpl.html'),
        link(scope, el) {
            // Fix for the autoresponder which doesn't contain a message on initial load.
            if (!scope.message) {
                return;
            }

            const { dispatcher } = dispatchers(['composer.update']);

            el[0].value = scope.message.DecryptedBody;

            scope.message.ccbcc = false;

            // proxy for saving as Mousetrap doesn't work with iframe
            const onKeyDown = _.debounce((e) => {
                // Check alt too cf Polis S #5476
                if (isKey(e, KEY.S)) {
                    e.preventDefault();
                    hotkeys.trigger('mod+s');
                }

                if (isKey(e, KEY.ENTER) && mailSettingsModel.get('Hotkeys') === 1) {
                    // The plaintext area can use the normal send because it directly updates the model
                    dispatcher['composer.update']('send.message', { message: scope.message });
                }
            }, 300);

            let isEditorFocused = false;
            const onFocus = () => (isEditorFocused = true);
            const onBlur = () => (isEditorFocused = false);
            const onInput = _.debounce(() => {
                isEditorFocused && dispatcher['composer.update']('autosave.message', { message: scope.message });
            }, SAVE_TIMEOUT_TIME);

            const onClick = () => {
                if (scope.message.ccbcc) {
                    scope.$applyAsync(() => (scope.message.ccbcc = false));
                }
            };

            el.on('click', onClick);
            el.on('input', onInput);
            el.on('blur', onBlur);
            el.on('focus', onFocus);
            el.on('keydown', onKeyDown);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                el.off('input', onInput);
                el.off('keydown', onKeyDown);
                el.off('blur', onBlur);
                el.off('focus', onFocus);
            });
        }
    };
}
export default plainTextArea;
