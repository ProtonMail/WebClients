/* @ngInject */
function squireSelectFontSize(squireDropdown, editorModel) {
    const ACTION = 'setFontSize';

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/squireSelectFontSize.tpl.html'),
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

            const onMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.target.nodeName !== 'LI') {
                    dropdown.toggle(parseContent(dropdown.refresh));
                }
            };

            el.on('mousedown', onMouseDown);

            scope.$on('$destroy', () => {
                el.off('mousedown', onMouseDown);
                dropdown.unsubscribe();
            });
        }
    };
}
export default squireSelectFontSize;
