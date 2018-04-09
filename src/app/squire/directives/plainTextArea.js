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
            // Fix for the autoresponder which doesn't contain a message on initial load.
            if (!scope.message) {
                return;
            }

            el[0].value = scope.message.DecryptedBody;

            scope.message.ccbcc = false;

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
