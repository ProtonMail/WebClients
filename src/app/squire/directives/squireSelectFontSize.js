angular.module('proton.squire')
    .directive('squireSelectFontSize', (squireDropdown, editorModel, onCurrentMessage) => {

        const ACTION = 'setFontSize';

        return {
            replace: true,
            templateUrl: 'templates/squire/squireSelectFontSize.tpl.html',
            link(scope, el) {

                const container = squireDropdown(scope.message);
                const dropdown = container.create(el[0], ACTION);
                const { editor } = editorModel.find(scope.message);

                container.attach(ACTION, {
                    node: el[0],
                    attribute: 'data-font-size'
                });

                const parseContent = () => {
                    const { size = '14px' } = editor.getFontInfo() || {};
                    const value = parseInt(size, 10);
                    dropdown.refresh(value, value);
                    return value;
                };

                const onClick = ({ target }) => {
                    if (target.nodeName !== 'LI') {
                        dropdown.toggle(parseContent);
                    }
                };
                const onActions = (type, data) => {
                    (data.action === ACTION) && parseContent();
                };

                el.on('click', onClick);
                editor.addEventListener('click', parseContent);
                const unsubscribe = onCurrentMessage('squire.editor', scope, onActions);

                scope.$on('$destroy', () => {
                    editor.removeEventListener('click', parseContent);
                    el.off('click', onClick);
                    unsubscribe();
                    dropdown.unsubscribe();
                });
            }

        };
    });
