angular.module('proton.squire')
    .directive('addLinkPopover', ($rootScope, editorModel, CONSTANTS, squireExecAction, regexEmail) => {

        const { DEFAULT_SQUIRE_VALUE } = CONSTANTS;
        const LINK_DEFAULT = DEFAULT_SQUIRE_VALUE.LINK;
        const CLASS_HIDDEN = 'addLinkPopover-hidden';
        const CLASS_UPDATE = 'addLinkPopover-editable';

        /**
         * Check if this is the current instance of the editor
         * @param  {Message} options.message Current message
         * @param  {String} options.ID      ID of the message loaded
         * @return {Boolean}
         */
        const isCurrent = ({ message = {} }, { ID = 'editor' } = {}) => {
            const currentID = message.ID || 'editor';
            return ID === currentID;
        };

        /**
         * Get the current link at the cursor or the current selected item
         * @param  {Message} message
         * @return {Object}         {href: textContent};
         */
        function getLinkAtCursor(message) {
            const { editor } = editorModel.find(message);
            const config = { href: LINK_DEFAULT, textContent: LINK_DEFAULT };
            if (!editor) {
                return config;
            }
            const selection = editor.getSelection();
            return angular.element(selection.commonAncestorContainer).closest('a')[0] || _.extend({}, config, {
                textContent: selection.toString()
            });
        }

        /**
         * Format a link to append a mailto or http before it
         * @param  {String} input
         * @return {String}
         */
        const formatLink = (input = '') => {
            if (regexEmail.test(input)) {
                return /mailto/.test(input) ? input : `mailto:${input}`.trim();
            }

            if (/^http(|s):/.test(input)) {
                return input;
            }

            return `http://${input}`;
        };

        const isUpdate = (link = LINK_DEFAULT) => (link && link !== LINK_DEFAULT);

        const onPopover = (message, node) => {
            return ({ action, form, name }, formName) => {
                if (formName !== name) {
                    return;
                }

                switch (action) {
                    case 'update':
                        squireExecAction.makeLink(message, formatLink(form.urlLink), form.labelLink);
                        break;
                    case 'close':
                        node.classList.add(CLASS_HIDDEN);
                        node.classList.remove(CLASS_UPDATE);
                        node.urlLink.value = LINK_DEFAULT;
                        node.labelLink.value = '';
                        break;
                    case 'remove':
                        squireExecAction.removeLink(message);
                        break;
                }
            };
        };

        const onCurrentMessage = (scope, onAction) => (e, { type, data }) => {
            isCurrent(scope, data.message) && onAction(type, data);
        };

        return {
            replace: true,
            templateUrl: 'templates/squire/addLinkPopover.tpl.html',
            link(scope, el, { name }) {

                const onAction = (type, data = {}) => {
                    if (type === 'popover.form') {
                        const modelPopover = onPopover(scope.message, el[0], scope);
                        return modelPopover(data, name);
                    }

                    if (type === 'squireActions' && data.action === 'makeLink') {
                        const link = getLinkAtCursor(scope.message);
                        el[0].urlLink.value = link.href;
                        el[0].labelLink.value = link.textContent;
                        el[0].classList.toggle(CLASS_HIDDEN);

                        isUpdate(el[0].urlLink.value) && el[0].classList.toggle(CLASS_UPDATE);
                        _rAF(() => el[0].querySelector('input').focus());
                    }
                };

                const unsubscribe = $rootScope.$on('squire.editor', onCurrentMessage(scope, onAction));

                scope.$on('$destroy', () => unsubscribe());

            }
        };
    });
