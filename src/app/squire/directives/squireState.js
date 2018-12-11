/* @ngInject */
function squireState(onCurrentMessage, editorModel, editorState, dispatchers) {
    const KEY_ARROW_INPUT = [38, 39, 40, 37, 33, 34, 36, 35]; // URDL FastUP FastDown

    const parse = (ID, editor) => {
        const { size = '14px', color = 'rgb(34, 34, 34)', family = 'arial', backgroundColor = 'rgb(255, 255, 255)' } =
            editor.getFontInfo() || {};

        editorState.set(ID, {
            size: parseInt(size, 10),
            font: family.replace(/["\\]/g, ''),
            color,
            backgroundColor,
            popover: undefined // Also close any popover (triggered when selecting or moving the cursor in the editor).
        });
    };

    const setEditorMode = (ID, editorMode) => {
        // Also close the popover when setting the editor mode.
        editorState.set(ID, { editorMode, popover: undefined });
    };

    const setPopover = (ID, popover) => {
        const { popover: oldPopover } = editorState.get(ID);
        // Special case, unset the popover it if it's already set. Triggered when toggling the button.
        if (oldPopover === popover) {
            editorState.set(ID, { popover: undefined });
            return;
        }
        // Set the popover.
        editorState.set(ID, { popover });
    };

    return {
        link(scope) {
            const { dispatcher } = dispatchers(['squire.messageSign']);

            const ID = scope.message.ID;
            const { editor } = editorModel.find(scope.message);

            // Set off the initial state
            parse(ID, editor);
            setEditorMode(ID, scope.message.MIMEType);

            const onClickEditor = () => parse(ID, editor);
            const onKeyup = (e) => KEY_ARROW_INPUT.includes(e.keyCode) && parse(ID, editor);

            const onAction = (type, data = {}) => {
                // Native editor actions.
                if (type === 'squire.native.action') {
                    switch (data.action) {
                        case 'setTextColour':
                        case 'setFontFace':
                        case 'setFontSize':
                        case 'setHighlightColour':
                            parse(ID, editor);
                            break;
                        // When a link is inserted or removed, unset the popover
                        case 'setTextDirectionLTR':
                        case 'setTextDirectionRTL':
                        case 'makeLink':
                        case 'removeLink':
                            setPopover(ID, undefined);
                            break;
                        case 'setEditorMode':
                            setEditorMode(ID, data.argument.value);
                            break;
                    }
                }
                // Toggle popover actions (they are called squireActions).
                if (type === 'squireActions') {
                    switch (data.action) {
                        case 'changeFontFamily':
                        case 'changeFontSize':
                        case 'makeLink':
                        case 'insertImage':
                        case 'changeColor':
                        case 'moreToggle':
                            setPopover(ID, data.action);
                            break;
                        case 'addKey':
                            scope.message.toggleAttachPublicKey();
                            dispatcher['squire.messageSign']('signed', { messageID: scope.message.ID });
                            break;
                        case 'sign':
                            scope.message.toggleSign();
                            dispatcher['squire.messageSign']('signed', { messageID: scope.message.ID });
                            break;
                        case 'requestReadReceipt':
                            scope.message.toggleReadReceipt();
                            break;
                        // On any normal action (like make bold, italic, removeFormatting) close the popover
                        default:
                            setPopover(ID, undefined);
                    }
                }
            };

            const unsubscribe = onCurrentMessage('squire.editor', scope, onAction);

            editor.addEventListener('click', onClickEditor);
            editor.addEventListener('keyup', onKeyup);

            scope.$on('$destroy', () => {
                unsubscribe();

                editor.removeEventListener('click', onClickEditor);
                editor.removeEventListener('keyup', onKeyup);
            });
        }
    };
}

export default squireState;
