angular.module('proton.squire')
    .factory('squireExecAction', (editorModel, $rootScope) => {

        $rootScope.$on('squire.editor', (e, { type, data }) => {
            (type === 'squireActions') && onAction(data);
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
        const makeLink = (message, link) => {
            const { editor, iframe } = editorModel.find(message);
            const node = angular.element(editor.getSelection().commonAncestorContainer).closest('a')[0];

            // Click inside a word select the whole word
            if (node) {
                const range = iframe[0].contentWindow.document.createRange();
                const selection = iframe[0].contentWindow.getSelection();
                range.selectNodeContents(node);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            editor.makeLink(link, {
                target: '_blank',
                title: link,
                rel: 'nofollow'
            });
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

        /**
         * Insert an image inside the editor
         * @param  {Message} message
         * @param  {String} value
         * @param  {File} file
         * @return {void}
         */
        const insertImage = (message, value, file) => {
            const { editor } = editorModel.find(message);
            const addImage = (value, alt = '') => {
                value && editor.insertImage(value, {
                    'data-attachment-id': file.ID,
                    class: 'proton-embedded',
                    alt
                });
            };

            if (file) {
                insertFile(file).then((body) => addImage(body, file.name));
            } else {
                addImage(value);
            }
        };

        /**
         * Perform an action for the current selected input
         * then focus into the editor
         * @param  {String} options.action  Action name
         * @param  {Message} options.message Current message
         * @return {void}
         */
        function onAction({ action, message }) {
            const { editor } = editorModel.find(message);
            const tests = testMap(editor, action);

            // We have custom behaviour for these actions
            if (action === 'makeLink' || action === 'insertImage') {
                return;
            }

            const actions = Object
                .keys(tests.tests)
                .filter((key) => tests.tests[key]);

            // Remove an action: ex italic
            if (actions.length) {
                actions.forEach((key) => editor[key]());
            } else {
                // Perform the action
                editor[action]();
            }

            editor.focus();
        }
        return { makeLink, removeLink, insertImage };

    });
