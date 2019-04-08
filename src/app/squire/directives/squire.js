import _ from 'lodash';
import { MIME_TYPES } from '../../constants';
import { setHtml, setPlaintext, setCursorStart, setSquireSelection } from '../helpers/textMode';

const { PLAINTEXT, DEFAULT } = MIME_TYPES;

/**
 * Check if this squire instance is for a message or not
 * Ex: you can work with a string instead of the message model
 *   => signature
 * @return {Boolean}
 */
const isMessage = (typeContent) => typeContent === 'message';

/**
 * Disable focus via TAB key when we switch are in mode: plaintext
 * @param  {Node} iframe
 * @return {Function}         arg:<Boolean> isPlaintext
 */
const tabIndexAble = (iframe) => (isPlainText) => {
    isPlainText && iframe.setAttribute('tabindex', '-1');
    !isPlainText && iframe.removeAttribute('tabindex');
};

/* @ngInject */
function squire(squireEditor, embedded, editorListener, dispatchers, sanitize, toggleModeEditor, onCurrentMessage) {
    const CLASS_NAMES = {
        LOADED: 'squireEditor-loaded'
    };

    return {
        scope: {
            message: '=?', // body
            value: '=?', // body
            allowEmbedded: '=',
            allowDataUri: '='
        },
        replace: true,
        templateUrl: require('../../../templates/directives/squire.tpl.html'),
        link(scope, el, { typeContent = 'message', action = '', id = 'composer' }) {
            const { dispatcher } = dispatchers(['message', 'composer.update']);

            scope.data = {};
            const $iframe = el.find('iframe.squireIframe');
            $iframe[0].id = `${id}${Date.now()}`;

            const setEditorLoaded = () => {
                el[0].classList.add(CLASS_NAMES.LOADED);
                scope.$applyAsync(() => (scope.isLoaded = true));
            };

            // Set the editor mode type data attribute, hides the plaintext editor or squire editor in CSS while doing so.
            const setEditorModeType = (mode) => (el[0].dataset.editorMode = mode);

            if (!isMessage(typeContent)) {
                scope.message = { ID: id, isPlainText: _.noop };
            }

            const listen = editorListener(scope, el, { typeContent, action });

            /**
             * Update the value of the message and send the state to the application
             * @param  {String}  val            Body
             * @param  {Boolean} dispatchAction Send the state to the app, default false.
             * @param  {Boolean} forceUpdate    Force update the message for the mode plain-text (prevent issue 6530)
             * @return {void}
             */
            async function updateMessageModel(val, dispatchAction = false, forceUpdate = false) {
                scope.message.touched = true;
                if (scope.message.MIMEType === PLAINTEXT) {
                    if (forceUpdate) {
                        // The plaintext editor uses the message model so use $applyAsync
                        scope.$applyAsync(() => {
                            scope.message.setDecryptedBody(val, false);
                            // Dispatch an event to update the message
                            dispatchAction && dispatcher.message('updated', { message: scope.message });
                        });
                    }
                    return;
                }
                // Sanitize the message with the DOMPurify config.
                const value = sanitize.message(val || '');
                // Replace the embedded images with CID to keep the model updated
                const body = await embedded.parser(scope.message, { direction: 'cid', text: value });
                // Update the model (note that this does not change anything in the squire editor so $applyAsync should not be needed)
                scope.message.setDecryptedBody(body);
                // Dispatch an event to update the message
                dispatchAction && dispatcher.message('updated', { message: scope.message });
            }

            /**
             * Update the value of the message and send the state to the application
             * @param  {String}  val            Body
             * @return {void}
             */
            function updateValueModel(val) {
                // Sanitize the message with the DOMPurify config.
                const value = sanitize.message(val || '');
                // Assume something might use scope.value so use $applyAsync
                scope.$applyAsync(() => (scope.value = value));
            }

            squireEditor.create($iframe, scope.message, typeContent).then(onLoadEditor);

            // Set default editor mode to html to prevent the plaintext area from showing.
            setEditorModeType(DEFAULT);

            async function onLoadEditor(editor) {
                const unsubscribe = [];
                const bindTabIndex = tabIndexAble($iframe[0]);
                // Ugly but need to get the textarea from the child directive after the editor has loaded.
                const textarea = el[0].querySelector('.plaintext-editor');

                if (isMessage(typeContent)) {
                    // On load we parse the body of the message in order to load its embedded images
                    // Assume that the message has been sanitized in composer.load first
                    const body = await embedded.parser(scope.message);

                    const isPlainText = scope.message.isPlainText();
                    bindTabIndex(isPlainText);
                    setEditorModeType(scope.message.MIMEType);

                    if (isPlainText) {
                        if (scope.message.isDraft() && !scope.message.new) {
                            // If it is a draft plaintext, it does not need to be converted.
                            setPlaintext(textarea, body);
                        } else {
                            // Even if it's a plaintext message, set the body in squire first because we are relying
                            // on its broken handling of BRs in the html to text conversion.
                            setHtml(scope.message, editor, body);
                            const plaintext = toggleModeEditor.toPlainText(scope.message, editor.getHTML());
                            setPlaintext(textarea, plaintext);
                        }
                    } else {
                        setHtml(scope.message, editor, body);
                    }

                    setEditorLoaded();
                    unsubscribe.push(listen(updateMessageModel, editor));
                } else {
                    editor.setHTML(scope.value || '');

                    // defer loading to prevent input event refresh (takes some time to perform the setHTML)
                    const timeoutId = setTimeout(() => {
                        unsubscribe.push(listen(updateValueModel, editor));
                        setEditorLoaded();
                        clearTimeout(timeoutId);
                    }, 100);
                }

                const setEditorModeCallback = (type, { action, argument } = {}) => {
                    if (!(type === 'squireActions' && action === 'setEditorMode' && action)) {
                        return;
                    }
                    const mode = argument.value;
                    if (!toggleModeEditor.canToggle(scope.message) || mode === scope.message.MIMEType) {
                        return;
                    }

                    const isPlainText = mode === PLAINTEXT;
                    bindTabIndex(isPlainText);

                    // If converting to plaintext, read the value (before it's hidden) from the squire editor, otherwise from the textarea.
                    const value = isPlainText ? editor.getHTML() : textarea.value;

                    setEditorModeType(mode);

                    if (isPlainText) {
                        const plaintext = toggleModeEditor.toPlainText(scope.message, value);
                        textarea.focus();
                        setPlaintext(textarea, plaintext);
                        setCursorStart(textarea);
                    } else {
                        const html = toggleModeEditor.toHtml(scope.message, value);
                        setHtml(scope.message, editor, html);
                        setSquireSelection(editor);
                    }
                };

                unsubscribe.push(onCurrentMessage('squire.editor', scope, setEditorModeCallback));

                dispatcher['composer.update']('editor.loaded', {
                    element: el,
                    editor,
                    message: scope.message,
                    isMessage: isMessage(typeContent)
                });

                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                    squireEditor.clean(scope.message);
                    toggleModeEditor.clear(scope.message);
                    editor.destroy();
                });
            }
        }
    };
}

export default squire;
