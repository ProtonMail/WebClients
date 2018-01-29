import _ from 'lodash';

/* @ngInject */
function squireExecAction(editorModel, $rootScope) {
    const dispatch = (type, data = {}) => $rootScope.$emit('squire.editor', { type, data });

    $rootScope.$on('squire.editor', (e, { type, data }) => {
        type === 'squireActions' && onAction(data);
    });

    /**
     * Test actions onto the curent editor
     * @param  {Squire} editor
     * @param  {String} action
     * @return {Object}        Map of tests, value
     */
    const testMap = (editor, action) => {
        const testOrderedList = editor.testPresenceinSelection('makeOrderedList', action, 'OL', />OL\b/);
        const testUnorderedList = editor.testPresenceinSelection('makeUnorderedList', action, 'UL', />UL\b/);

        return {
            value: action,
            tests: {
                removeBold: editor.testPresenceinSelection('bold', action, 'B', />B\b/),
                removeItalic: editor.testPresenceinSelection('italic', action, 'I', />I\b/),
                removeUnderline: editor.testPresenceinSelection('underline', action, 'U', />U\b/),
                removeList: testOrderedList || testUnorderedList,
                removeLink: editor.testPresenceinSelection('removeLink', action, 'A', />A\b/),
                decreaseQuoteLevel: editor.testPresenceinSelection('increaseQuoteLevel', action, 'blockquote', />blockquote\b/)
            },
            isNotValue(a) {
                return a === action && this.value !== '';
            }
        };
    };

    /**
     * Create a link inside the editor
     * @param  {Message} message
     * @param  {String} link
     * @return {void}
     */
    const makeLink = (message, link = '', title) => {
        const { editor, iframe } = editorModel.find(message);
        const node = angular.element(editor.getSelection().commonAncestorContainer).closest('a')[0];
        const range = iframe[0].contentWindow.document.createRange();
        const selection = iframe[0].contentWindow.getSelection();

        // Click inside a word select the whole word
        if (node) {
            range.selectNodeContents(node);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        editor.makeLink(link, {
            target: '_blank',
            title: link,
            rel: 'nofollow'
        });

        const newSelection = angular.element(editor.getSelection().commonAncestorContainer);
        (newSelection.closest('a')[0] || newSelection.find('a')[0]).textContent = title || link;
    };

    /**
     * Remove th current selected link
     * @param  {Message} message
     * @return {void}
     */
    const removeLink = (message) => {
        const { editor } = editorModel.find(message);
        editor.removeLink();
    };

    const insertFile = (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.addEventListener('error', () => reject(reader), false);

            if (file && file.type.match('image.*')) {
                reader.readAsDataURL(file);
            }
        });
    };

    const changeColor = (message, color, mode = 'color') => {
        const { editor } = editorModel.find(message);
        const action = mode === 'color' ? 'setTextColour' : 'setHighlightColour';
        editor[action](color);
        dispatch('squire.native.action', { action, argument: color, message });
    };

    /**
     * Insert an image inside the editor
     * @param  {Message} message
     * @param  {String} value
     * @param  {File} file
     * @return {void}
     */
    const insertImage = (message, { url, file, opt = {} } = {}) => {
        const { editor } = editorModel.find(message);
        opt.class = ((opt.class || ' ') + 'proton-embedded').trim();

        const addImage = (url, opt) => {
            editor.focus();
            url && editor.insertImage(url, _.extend({}, opt));
        };

        if (file) {
            const config = _.extend({}, opt, { alt: file.name || file.Name });
            insertFile(file).then((body) => addImage(body, config));
        } else {
            addImage(url, opt);
        }
    };

    const formatNativeValue = (action, { value }) => {
        return action === 'setFontSize' ? `${value}px` : value;
    };

    /**
     * Perform an action for the current selected input
     * then focus into the editor
     * @param  {String} options.action  Action name
     * @param  {Message} options.message Current message
     * @return {void}
     */
    function onAction({ action, argument = {}, message }) {
        const { editor } = editorModel.find(message);
        const tests = testMap(editor, action);

        // We have custom behaviour for these actions
        if (/^(makeLink|insertImage|changeColor)$/.test(action)) {
            return;
        }
        const actions = Object.keys(tests.tests).filter((key) => tests.tests[key]);

        // Remove an action: ex italic
        if (actions.length) {
            actions.forEach((key) => editor[key]());
        } else {
            // Perform the action
            action !== 'setEditorMode' && editor[action](formatNativeValue(action, argument));
            dispatch('squire.native.action', { action, argument, message });
        }

        editor.focus();
    }
    return { makeLink, removeLink, insertImage, changeColor };
}
export default squireExecAction;
