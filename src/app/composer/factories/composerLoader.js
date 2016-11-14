angular.module('proton.composer')
    .factory('composerLoader', () => {

        /**
         * Custom focus to the composer depending of the source from the click event
         *     - Fix issue with the templating (Todo refacto HTML composer to improve KISS)
         *     - Allow the user to focus as fast we can, onLoad we add a delay after $compile to ensure the focus
         * @param  {Angular.element} el             Composer
         * @param  {scope} scope
         * @param  {Squire} editor
         * @return {void}
         */
        function customFocus(el, scope, editor) {

            // We already inside the composer with a focused node, do nothing
            if (!el[0] || (el[0].contains(document.activeElement) && el[0] !== document.activeElement)) {
                return;
            }

            // Add a delay to ensure that the dom is ready onLoad
            const id = setTimeout(() => {
                clearTimeout(id);

                const { ToList = [], CCList = [], BCCList = [] } = scope.selected;

                if (![].concat(ToList, CCList, BCCList).length) {
                    const input = el.find('.toRow').find('input').eq(0);
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

                _rAF(() => editor.focus());
            }, 300);
        }

        function focusMessage(scope) {

            return ({ composer, index, message, focusEditor, keepState = true }, editor) => {

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

                message.editor = message.editor || editor;
                scope.selected = message;
                !keepState && (scope.selected.autocompletesFocussed = false);

                if (focusEditor) {
                    return editor.focus();
                }

                !keepState && customFocus(composer, scope, editor || message.editor);
            };
        }

        return focusMessage;
    });
