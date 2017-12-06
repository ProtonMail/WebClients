/* @ngInject */
function squireSelectFontSize(squireDropdown, editorModel) {
    const ACTION = 'setFontSize';

    return {
        replace: true,
        templateUrl: 'templates/squire/squireSelectFontSize.tpl.html',
        link(scope, el) {
            const container = squireDropdown(scope.message);
            const { editor } = editorModel.find(scope.message);

            const parseContent = (refresh) => () => {
                const { size = '14px' } = editor.getFontInfo() || {};
                const value = parseInt(size, 10);
                refresh(value, value);
                return value;
            };

            const dropdown = container.create(el[0], ACTION, {
                attribute: 'data-font-size',
                parseContent
            });

            const onClick = ({ target }) => {
                if (target.nodeName !== 'LI') {
                    dropdown.toggle(parseContent(dropdown.refresh));
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                dropdown.unsubscribe();
            });
        }
    };
}
export default squireSelectFontSize;
