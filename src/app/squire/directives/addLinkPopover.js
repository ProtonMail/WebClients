angular.module('proton.squire')
    .directive('addLinkPopover', ($rootScope, editorModel, CONSTANTS, squireExecAction) => {

        const { DEFAULT_SQUIRE_VALUE } = CONSTANTS;
        const LINK_DEFAULT = DEFAULT_SQUIRE_VALUE.LINK_DEFAULT;
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

        function getLinkAtCursor(message) {
            const { editor } = editorModel.find(message);
            if (!editor) {
                return LINK_DEFAULT;
            }
            return angular.element(editor.getSelection().commonAncestorContainer).closest('a').attr('href');
        }

        const isUpdate = (link = LINK_DEFAULT) => (link && link !== LINK_DEFAULT);

        const onPopover = (message, node, scope) => {
            return ({ action, form, name }, formName) => {
                if (formName !== name) {
                    return;
                }

                switch (action) {
                    case 'update':
                        squireExecAction.makeLink(message, form.url);
                        break;
                    case 'close':
                        node.classList.add(CLASS_HIDDEN);
                        node.classList.remove(CLASS_UPDATE);
                        scope.$applyAsync(() => scope.data.link = LINK_DEFAULT);
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
                        return scope.$applyAsync(() => {
                            scope.data.link = getLinkAtCursor(scope.message);

                            el[0].classList.toggle(CLASS_HIDDEN);
                            isUpdate(scope.data.link) && el[0].classList.toggle(CLASS_UPDATE);

                            _rAF(() => el[0].querySelector('input').focus());

                        });
                    }
                };

                const unsubscribe = $rootScope.$on('squire.editor', onCurrentMessage(scope, onAction));

                scope.$on('$destroy', () => unsubscribe());

            }
        };
    });
