import _ from 'lodash';
import { MIME_TYPES } from '../../constants';
import { setCursorStart } from '../../squire/helpers/textMode';
import { isSafari } from '../../../helpers/browser';
import { forceRedraw } from '../../../helpers/domHelper';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function composerLoader(dispatchers, editorModel) {
    /**
     * Custom focus to the composer depending of the source from the click event
     *     - Fix issue with the templating (Todo refacto HTML composer to improve KISS)
     *     - Allow the user to focus as fast we can, onLoad we add a delay after $compile to ensure the focus
     * @param  {Angular.element} el             Composer
     * @param  {scope} scope
     * @param  {Squire} editor
     * @return {void}
     */
    function customFocus(el, scope, message) {
        // We already inside the composer with a focused node, do nothing
        if (!el[0] || (el[0].contains(document.activeElement) && el[0] !== document.activeElement)) {
            return;
        }

        // Add a delay to ensure that the dom is ready onLoad
        const id = setTimeout(() => {
            const { editor } = editorModel.find(message);

            if (editor && isSafari()) {
                // eslint-disable-next-line no-underscore-dangle
                const editorBody = editor._doc.body;
                /**
                 * On Safari, there is an issue with Squire and scrolling because of the iframe.
                 * See https://bugs.webkit.org/show_bug.cgi?id=169129
                 * When the composer is loaded with a large message scrolling with the scroll wheel does not work.
                 * See https://github.com/ProtonMail/Angular/issues/6874
                 */
                forceRedraw(editorBody);
            }

            clearTimeout(id);

            const textarea = el.find('.plaintext-editor')[0];
            // Even if not in plaintext mode, set the cursor to start to make it set in case the user is using tab.
            // https://github.com/ProtonMail/Angular/issues/6918
            setCursorStart(textarea);

            const { ToList = [], CCList = [], BCCList = [] } = scope.selected;

            if (![].concat(ToList, CCList, BCCList).length) {
                const input = el
                    .find('.toRow')
                    .find('input')
                    .eq(0);
                if (input.get(0)) {
                    return scope.$applyAsync(() => {
                        scope.selected.autocompletesFocussed = true;
                        _rAF(() => input.focus());
                    });
                }
            }

            if (!scope.selected.Subject.length) {
                return el.find('.subject').focus();
            }

            if (message.MIMEType === PLAINTEXT) {
                textarea.focus();
                return;
            }

            if (editor) {
                return editor.focus();
            }

            const { on, unsubscribe } = dispatchers();

            // If the iframe is not loaded yet wait for it then remove the listener
            on('composer.update', (e, { type, data }) => {
                if (type !== 'editor.loaded') {
                    return;
                }

                if (message.ID === data.message.ID) {
                    data.editor.focus();
                    unsubscribe();
                }
            });
        }, 300);
    }

    function focusMessage(scope) {
        return ({ composer, index, message, focusEditor, keepState = true }) => {
            if (message.focussed) {
                return;
            }

            const messagesLength = scope.messages.length;
            _.each(scope.messages, (msg, iteratee) => {
                msg.focussed = false;
                if (iteratee > index) {
                    msg.zIndex = (messagesLength - (iteratee - index)) * 100;
                } else {
                    msg.zIndex = messagesLength * 100;
                }
            });
            message.focussed = true;

            scope.selected = message;
            !keepState && (scope.selected.autocompletesFocussed = false);

            if (focusEditor) {
                const { editor } = editorModel.find(message);
                return editor.focus();
            }

            !keepState && customFocus(composer, scope, message);
        };
    }

    return focusMessage;
}
export default composerLoader;
