import _ from 'lodash';

/* @ngInject */
function squireSelectFontFamily(squireDropdown, editorModel) {
    const ACTION = 'setFontFace';
    const MAP = {
        georgia: 'Georgia',
        arial: 'Arial',
        verdana: 'Verdana',
        tahoma: 'Tahoma',
        'trebuchet ms': 'Trebuchet MS',
        helvetica: 'Helvetica',
        'times new roman': 'Times New Roman',
        menlo: 'Monospace',
        consolas: 'Monospace',
        'courier new': 'Monospace',
        monospace: 'Monospace'
    };
    const KEYS = Object.keys(MAP);

    const getFont = (font) => {
        const key = _.find(KEYS, (key) => new RegExp(key).test(font));
        return MAP[key];
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/squireSelectFontFamily.tpl.html'),
        link(scope, el) {
            const container = squireDropdown(scope.message);
            const { editor } = editorModel.find(scope.message);

            const parseContent = (refresh) => () => {
                const { family = 'arial' } = editor.getFontInfo() || {};
                const font = family.replace(/"/g, '');
                refresh(getFont(font), font);
                return font;
            };

            const dropdown = container.create(el[0], ACTION, {
                attribute: 'data-font-family',
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
export default squireSelectFontFamily;
