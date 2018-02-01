import _ from 'lodash';
import { CONSTANTS } from '../../constants';

/* @ngInject */
function plainTextArea($rootScope, mailSettingsModel) {
    const KEY = {
        ENTER: 13,
        S: 83
    };
    const isKey = (e, code) => !e.altKey && (e.ctrlKey || e.metaKey) && e.keyCode === code;

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/plainTextArea.tpl.html'),
        link(scope, el) {
            const { DraftMIMEType } = mailSettingsModel.get();
            /*
                Set the selection to the start instead of the end just like with squire.
                only set it on first load as we should remember the location after first use.
                (otherwise you start typing after the signature which is bad UX OR even worse after the reply chain)
                we need to ensure the data is in there, to prevent the selection from changing after ng-model is applied
             */
            el[0].value = scope.message.DecryptedBody;
            el[0].selectionStart = 0;
            el[0].selectionEnd = 0;

            scope.message.ccbcc = false;

            /**
             * Reply-ReplyAll-forward for default mode plaintext we focus
             * For a new message there is composerLoader to focus the correct item
             */
            if (DraftMIMEType === 'text/plain' && _.has(scope.message, 'Action')) {
                _rAF(() => el.focus());
            }

            /**
             * Not HTML, it means we display it via an action on the composer,
             * we can focus the editor. It's fine
             */
            if (DraftMIMEType !== 'text/plain') {
                _rAF(() => el.focus());
            }

            // proxy for saving as Mousetrap doesn't work with iframe
            const onKeyDown = (e) => {
                // Check alt too cf Polis S #5476
                if (isKey(e, KEY.S)) {
                    e.preventDefault();
                    Mousetrap.trigger('mod+s');
                }

                if (isKey(e, KEY.ENTER) && mailSettingsModel.get('Hotkeys') === 1) {
                    $rootScope.$emit('composer.update', {
                        type: 'send.message',
                        data: { message: scope.message }
                    });
                }
            };

            const onInput = _.debounce(() => {
                $rootScope.$emit('plaintextarea', {
                    type: 'input',
                    data: { message: scope.message }
                });
            }, CONSTANTS.SAVE_TIMEOUT_TIME);

            const onClick = () => {
                if (scope.message.ccbcc) {
                    scope.$applyAsync(() => (scope.message.ccbcc = false));
                }
            };

            el.on('click', onClick);
            el.on('input', onInput);
            el.on('keydown', onKeyDown);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                el.off('input', onInput);
                el.off('keydown', onKeyDown);
            });
        }
    };
}
export default plainTextArea;
