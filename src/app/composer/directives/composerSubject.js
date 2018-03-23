import _ from 'lodash';
import { MIME_TYPES } from '../../constants';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
const composerSubject = (editorModel) => ({
    replace: true,
    templateUrl: require('../../../templates/directives/composer/composerSubject.tpl.html'),
    link(scope, el) {
        const $input = el[0].querySelector('input');

        const onFocus = () => {
            scope.$applyAsync(() => {
                scope.message.autocompletesFocussed = false;
                scope.message.ccbcc = false;
                scope.message.attachmentsToggle = false;
            });
        };

        const onKeydown = _.throttle((e) => {
            // TAB
            if (e.which !== 9) {
                return;
            }
            if (scope.message.MIMEType === PLAINTEXT) {
                // todo make this an event?
                e.preventDefault();
                return el
                    .parents('.composer')
                    .find('textarea')
                    .focus();
            }

            const { editor } = editorModel.find(scope.message);

            if (editor && scope.message.MIMEType !== PLAINTEXT) {
                e.preventDefault();
                editor.focus();
            }
        }, 150);

        const onBlur = ({ relatedTarget }) => {
            // If the target that gained focus was the discard button, don't save the draft.
            if (relatedTarget && relatedTarget.classList.contains('composer-btn-discard')) {
                return;
            }
            scope.$applyAsync(() => {
                // Don't trigger the save of this message in case it is due to the composer closing.
                // In this case the message has already been saved.
                if (scope.$$destroyed) {
                    return;
                }
                scope.saveLater(scope.message);
            });
        };

        $input.addEventListener('focus', onFocus, true);
        $input.addEventListener('keydown', onKeydown, false);
        $input.addEventListener('blur', onBlur, false);

        scope.$on('$destroy', () => {
            $input.removeEventListener('focus', onFocus, true);
            $input.removeEventListener('keydown', onKeydown, false);
            $input.removeEventListener('blur', onBlur, false);
        });
    }
});
export default composerSubject;
