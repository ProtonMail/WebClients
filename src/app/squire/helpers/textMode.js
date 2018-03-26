/**
 * Set the plaintext editor value.
 * @param {TextArea} textarea
 * @param {String} plaintext
 */
export const setPlaintext = (textarea, plaintext) => {
    textarea.value = plaintext;
};

/**
 * Move the textarea cursor to the front.
 * @param textarea
 */
export const setCursorStart = (textarea) => {
    // Edge needs to focus the textarea before we can set the selection to the beginning.
    textarea.focus();
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;
    textarea.scrollTop = 0;
};

/**
 * Set the squire editor on initial load.
 * @param {Message} message
 * @param {Squire} editor
 * @param {String} body
 */
export const setHtml = (message, editor, body) => {
    editor.setHTML(body);
    if (message.RightToLeft) {
        editor.setTextDirectionWithoutFocus('rtl');
    }
};

export const setSquireSelection = (editor) => {
    editor.focus();
    // solve a bug where the selection is not intialized properly making it impossible to add ul/ol'
    const orgSelection = editor.getSelection();
    // check if the initialization is already correct.
    if (orgSelection.startContainer.tagName !== 'BODY' && orgSelection.endContainer.tagName !== 'BODY') {
        return;
    }
    editor.moveCursorToStart();
};
